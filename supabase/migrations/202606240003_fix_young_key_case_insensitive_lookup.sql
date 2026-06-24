-- Fix: busca de young_key case-insensitive nas RPCs de transferencia
-- As chaves sao armazenadas em mixed case (@ALN-nome1234) mas a busca usava lower() so no input,
-- nunca encontrando o destinatario. Agora ambos os lados sao normalizados com lower().

DROP FUNCTION IF EXISTS public.transfer_youngcoin_tx(uuid, text, numeric, text, text, text, text);

CREATE OR REPLACE FUNCTION public.transfer_youngcoin_tx(
  p_actor_id uuid,
  p_to_young_key text,
  p_amount numeric,
  p_description text,
  p_idempotency_key text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_from_wallet public.wallets;
  v_to_profile  public.profiles;
  v_to_wallet   public.wallets;
  v_tx          public.transactions;
  v_existing    public.transactions;
  v_limits      public.transfer_limits;
  v_daily_total numeric;
  v_minute_count int;
  v_from_profile public.profiles;
BEGIN
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) >= 8 THEN
    SELECT * INTO v_existing FROM public.transactions WHERE idempotency_key = trim(p_idempotency_key);
    IF v_existing.id IS NOT NULL THEN RETURN v_existing; END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_amount != round(p_amount, 2) THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  SELECT * INTO v_from_profile FROM public.profiles WHERE id = p_actor_id AND status = 'active';
  IF v_from_profile.id IS NULL THEN RAISE EXCEPTION 'SENDER_NOT_FOUND'; END IF;

  SELECT * INTO v_from_wallet FROM public.wallets WHERE profile_id = p_actor_id AND status = 'active' FOR UPDATE;
  IF v_from_wallet.id IS NULL THEN RAISE EXCEPTION 'SENDER_WALLET_NOT_FOUND'; END IF;

  -- Busca case-insensitive
  SELECT * INTO v_to_profile FROM public.profiles
  WHERE lower(young_key) = lower(trim(p_to_young_key)) AND status = 'active';
  IF v_to_profile.id IS NULL THEN RAISE EXCEPTION 'DESTINATION_NOT_FOUND'; END IF;

  SELECT * INTO v_to_wallet FROM public.wallets WHERE profile_id = v_to_profile.id AND status = 'active' FOR UPDATE;
  IF v_to_wallet.id IS NULL THEN RAISE EXCEPTION 'DESTINATION_WALLET_NOT_FOUND'; END IF;

  IF v_from_wallet.id = v_to_wallet.id THEN RAISE EXCEPTION 'SELF_TRANSFER_BLOCKED'; END IF;

  SELECT * INTO v_limits FROM public.transfer_limits WHERE account_type = v_from_profile.account_type;
  IF v_limits.id IS NOT NULL THEN
    IF p_amount > v_limits.transaction_limit THEN
      INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
      VALUES (p_actor_id, 'transfer.transaction_limit_exceeded', 'medium',
        jsonb_build_object('amount', p_amount, 'limit', v_limits.transaction_limit));
      RAISE EXCEPTION 'TRANSACTION_LIMIT_EXCEEDED';
    END IF;
    SELECT coalesce(sum(amount), 0) INTO v_daily_total
    FROM public.transactions
    WHERE from_wallet_id = v_from_wallet.id AND status = 'completed'
      AND created_at > now() - interval '24 hours';
    IF (v_daily_total + p_amount) > v_limits.daily_limit THEN
      INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
      VALUES (p_actor_id, 'transfer.daily_limit_exceeded', 'medium',
        jsonb_build_object('daily_total', v_daily_total, 'amount', p_amount, 'limit', v_limits.daily_limit));
      RAISE EXCEPTION 'DAILY_LIMIT_EXCEEDED';
    END IF;
  END IF;

  SELECT count(*) INTO v_minute_count
  FROM public.transactions
  WHERE from_wallet_id = v_from_wallet.id AND created_at > now() - interval '1 minute';
  IF v_minute_count >= 5 THEN
    INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
    VALUES (p_actor_id, 'transfer.rate_limited', 'high',
      jsonb_build_object('count_last_minute', v_minute_count));
    RAISE EXCEPTION 'RATE_LIMITED';
  END IF;

  IF v_from_wallet.balance < p_amount THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS'; END IF;

  UPDATE public.wallets SET balance = balance - p_amount WHERE id = v_from_wallet.id;
  UPDATE public.wallets SET balance = balance + p_amount WHERE id = v_to_wallet.id;

  INSERT INTO public.transactions (
    idempotency_key, from_wallet_id, to_wallet_id, amount, type, status, description, created_by, metadata
  ) VALUES (
    trim(p_idempotency_key), v_from_wallet.id, v_to_wallet.id, p_amount, 'transfer', 'completed',
    coalesce(trim(p_description), ''), p_actor_id,
    jsonb_build_object('ip_address', p_ip_address, 'user_agent', p_user_agent)
  ) RETURNING * INTO v_tx;

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id, after_data, metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'transaction.transfer', 'transaction', v_tx.id, to_jsonb(v_tx),
    jsonb_build_object('from_young_key', v_from_profile.young_key, 'to_young_key', p_to_young_key, 'amount', p_amount),
    p_ip_address, p_user_agent
  );

  RETURN v_tx;
END;
$function$;

-- Recria transfer_from_org_wallet com busca case-insensitive
CREATE OR REPLACE FUNCTION public.transfer_from_org_wallet(
  p_actor_id uuid,
  p_to_young_key text,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor public.profiles;
  v_membership public.organization_members;
  v_org_wallet public.wallets;
  v_to_profile public.profiles;
  v_to_wallet public.wallets;
  v_tx public.transactions;
  v_existing public.transactions;
  v_limits public.transfer_limits;
  v_daily_total numeric;
  v_minute_count int;
BEGIN
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) >= 8 THEN
    SELECT * INTO v_existing FROM public.transactions WHERE idempotency_key = trim(p_idempotency_key);
    IF v_existing.id IS NOT NULL THEN RETURN v_existing; END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_amount != round(p_amount, 2) THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id AND status = 'active';
  IF v_actor.id IS NULL THEN RAISE EXCEPTION 'ACTOR_NOT_FOUND'; END IF;

  SELECT * INTO v_membership
  FROM public.organization_members
  WHERE profile_id = p_actor_id AND member_role IN ('teacher', 'staff', 'admin') AND status = 'active'
  LIMIT 1;
  IF v_membership.id IS NULL THEN RAISE EXCEPTION 'NOT_A_COLLABORATOR'; END IF;

  SELECT * INTO v_org_wallet
  FROM public.wallets
  WHERE organization_id = v_membership.organization_id AND wallet_type = 'business' AND status = 'active'
  FOR UPDATE;
  IF v_org_wallet.id IS NULL THEN RAISE EXCEPTION 'ORG_WALLET_NOT_FOUND'; END IF;

  -- Busca case-insensitive
  SELECT * INTO v_to_profile FROM public.profiles
  WHERE lower(young_key) = lower(trim(p_to_young_key)) AND status = 'active';
  IF v_to_profile.id IS NULL THEN RAISE EXCEPTION 'DESTINATION_NOT_FOUND'; END IF;

  SELECT * INTO v_to_wallet FROM public.wallets WHERE profile_id = v_to_profile.id AND status = 'active' FOR UPDATE;
  IF v_to_wallet.id IS NULL THEN RAISE EXCEPTION 'DESTINATION_WALLET_NOT_FOUND'; END IF;

  IF v_org_wallet.id = v_to_wallet.id THEN RAISE EXCEPTION 'SELF_TRANSFER_BLOCKED'; END IF;

  SELECT * INTO v_limits FROM public.transfer_limits WHERE account_type = 'business';
  IF v_limits.id IS NOT NULL THEN
    IF p_amount > v_limits.transaction_limit THEN
      INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
      VALUES (p_actor_id, 'org_transfer.transaction_limit_exceeded', 'medium',
        jsonb_build_object('amount', p_amount, 'limit', v_limits.transaction_limit));
      RAISE EXCEPTION 'TRANSACTION_LIMIT_EXCEEDED';
    END IF;
    SELECT coalesce(sum(amount), 0) INTO v_daily_total
    FROM public.transactions
    WHERE from_wallet_id = v_org_wallet.id AND status = 'completed'
      AND created_at > now() - interval '24 hours';
    IF (v_daily_total + p_amount) > v_limits.daily_limit THEN
      INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
      VALUES (p_actor_id, 'org_transfer.daily_limit_exceeded', 'medium',
        jsonb_build_object('daily_total', v_daily_total, 'amount', p_amount, 'limit', v_limits.daily_limit));
      RAISE EXCEPTION 'DAILY_LIMIT_EXCEEDED';
    END IF;
  END IF;

  SELECT count(*) INTO v_minute_count
  FROM public.transactions
  WHERE from_wallet_id = v_org_wallet.id AND created_at > now() - interval '1 minute';
  IF v_minute_count >= 10 THEN
    INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
    VALUES (p_actor_id, 'org_transfer.rate_limited', 'high',
      jsonb_build_object('count_last_minute', v_minute_count));
    RAISE EXCEPTION 'RATE_LIMITED';
  END IF;

  IF v_org_wallet.balance < p_amount THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS'; END IF;

  UPDATE public.wallets SET balance = balance - p_amount WHERE id = v_org_wallet.id;
  UPDATE public.wallets SET balance = balance + p_amount WHERE id = v_to_wallet.id;

  INSERT INTO public.transactions (
    idempotency_key, from_wallet_id, to_wallet_id, amount, type, status, description, created_by, metadata
  ) VALUES (
    trim(p_idempotency_key), v_org_wallet.id, v_to_wallet.id, p_amount, 'transfer', 'completed',
    coalesce(trim(p_description), ''), p_actor_id,
    jsonb_build_object('ip_address', p_ip_address, 'user_agent', p_user_agent,
      'actor_name', v_actor.display_name, 'actor_young_key', v_actor.young_key,
      'organization_id', v_membership.organization_id)
  ) RETURNING * INTO v_tx;

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id, after_data, metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'transaction.org_transfer', 'transaction', v_tx.id, to_jsonb(v_tx),
    jsonb_build_object('actor_young_key', v_actor.young_key, 'to_young_key', p_to_young_key,
      'amount', p_amount, 'organization_id', v_membership.organization_id),
    p_ip_address, p_user_agent
  );

  RETURN v_tx;
END;
$function$;
