-- Bloqueia transferência entre alunos (personal → personal).
-- Aluno só pode transferir para colaborador (sub_business) ou escola (business).
-- Colaboradores e banco continuam sem restrição de destinatário.

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

  -- Bloqueia transferência aluno → aluno
  IF v_from_profile.account_type = 'personal' AND v_to_profile.account_type = 'personal' THEN
    INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
    VALUES (p_actor_id, 'transfer.peer_transfer_blocked', 'low',
      jsonb_build_object('to_young_key', p_to_young_key, 'amount', p_amount));
    RAISE EXCEPTION 'PEER_TRANSFER_BLOCKED';
  END IF;

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
