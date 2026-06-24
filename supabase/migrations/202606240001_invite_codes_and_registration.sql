-- ============================================================
-- Migration: Codigos Convite, Cadastro e Contas Colaborativas
-- ============================================================

-- A1. Novas colunas em organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS invite_code_student text,
  ADD COLUMN IF NOT EXISTS invite_code_staff text,
  ADD COLUMN IF NOT EXISTS access_pin text;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_invite_code_student_key UNIQUE (invite_code_student),
  ADD CONSTRAINT organizations_invite_code_staff_key UNIQUE (invite_code_staff);

-- A2. Novas colunas em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS sport text,
  ADD COLUMN IF NOT EXISTS about text,
  ADD COLUMN IF NOT EXISTS hobby text,
  ADD COLUMN IF NOT EXISTS invited_by_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- A3. Funcao para gerar codigo convite (AAA0000)
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code text;
  v_letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  v_i int;
BEGIN
  LOOP
    v_code := '';
    FOR v_i IN 1..3 LOOP
      v_code := v_code || substr(v_letters, floor(random() * 26 + 1)::int, 1);
    END LOOP;
    v_code := v_code || lpad(floor(random() * 10000)::text, 4, '0');

    IF NOT EXISTS (
      SELECT 1 FROM public.organizations
      WHERE invite_code_student = v_code OR invite_code_staff = v_code
    ) THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$function$;

-- A4. Atualizar create_organization_account_tx com email e codigos
CREATE OR REPLACE FUNCTION public.create_organization_account_tx(
  p_actor_id uuid,
  p_name text,
  p_slug text,
  p_email text DEFAULT NULL,
  p_owner_profile_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE(organization organizations, business_wallet wallets)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org public.organizations;
  v_wallet public.wallets;
  v_slug text;
  v_code_student text;
  v_code_staff text;
BEGIN
  IF NOT public.is_bank_admin(p_actor_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'INVALID_ORGANIZATION_NAME';
  END IF;

  IF p_slug IS NULL THEN
    RAISE EXCEPTION 'INVALID_ORGANIZATION_SLUG';
  END IF;

  v_slug := lower(regexp_replace(trim(p_slug), '[^a-zA-Z0-9_-]+', '-', 'g'));
  IF length(v_slug) < 2 THEN
    RAISE EXCEPTION 'INVALID_ORGANIZATION_SLUG';
  END IF;

  IF p_owner_profile_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_owner_profile_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'OWNER_PROFILE_NOT_ACTIVE';
  END IF;

  v_code_student := public.generate_invite_code();
  v_code_staff := public.generate_invite_code();

  INSERT INTO public.organizations (name, slug, email, invite_code_student, invite_code_staff, owner_profile_id, status)
  VALUES (trim(p_name), v_slug, trim(p_email), v_code_student, v_code_staff, p_owner_profile_id, 'active')
  RETURNING * INTO v_org;

  INSERT INTO public.wallets (profile_id, organization_id, wallet_type, status)
  VALUES (NULL, v_org.id, 'business', 'active')
  RETURNING * INTO v_wallet;

  IF p_owner_profile_id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, profile_id, member_role, status)
    VALUES (v_org.id, p_owner_profile_id, 'admin', 'active')
    ON CONFLICT (organization_id, profile_id) DO UPDATE
      SET member_role = 'admin', status = 'active';
  END IF;

  INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, after_data, metadata, ip_address, user_agent)
  VALUES (
    p_actor_id, 'organization.created', 'organization', v_org.id,
    to_jsonb(v_org),
    jsonb_build_object(
      'business_wallet_id', v_wallet.id,
      'owner_profile_id', p_owner_profile_id,
      'invite_code_student', v_code_student,
      'invite_code_staff', v_code_staff
    ),
    p_ip_address, p_user_agent
  );

  RETURN QUERY SELECT v_org, v_wallet;
END;
$function$;

-- A5. Validar codigo convite (acessivel sem autenticacao)
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS TABLE(valid boolean, organization_id uuid, organization_name text, code_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org public.organizations;
  v_code text;
BEGIN
  v_code := upper(trim(p_code));

  SELECT * INTO v_org
  FROM public.organizations
  WHERE (invite_code_student = v_code OR invite_code_staff = v_code)
    AND status = 'active';

  IF v_org.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF v_org.invite_code_student = v_code THEN
    RETURN QUERY SELECT true, v_org.id, v_org.name, 'student'::text;
  ELSE
    RETURN QUERY SELECT true, v_org.id, v_org.name, 'staff'::text;
  END IF;
END;
$function$;

-- Permitir chamada anonima do validate_invite_code
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO authenticated;

-- A6. Cadastro via codigo convite
CREATE OR REPLACE FUNCTION public.register_with_invite(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_birth_date date,
  p_country text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_sport text DEFAULT NULL,
  p_about text DEFAULT NULL,
  p_hobby text DEFAULT NULL,
  p_invite_code text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE(profile profiles, wallet wallets)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org public.organizations;
  v_code text;
  v_code_type text;
  v_account_type text;
  v_role text;
  v_member_role text;
  v_profile public.profiles;
  v_wallet public.wallets;
  v_young_key text;
BEGIN
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;
  IF p_birth_date IS NULL THEN
    RAISE EXCEPTION 'INVALID_BIRTH_DATE';
  END IF;
  IF p_invite_code IS NULL THEN
    RAISE EXCEPTION 'INVALID_INVITE_CODE';
  END IF;

  v_code := upper(trim(p_invite_code));

  SELECT * INTO v_org
  FROM public.organizations
  WHERE (invite_code_student = v_code OR invite_code_staff = v_code)
    AND status = 'active';

  IF v_org.id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INVITE_CODE';
  END IF;

  IF v_org.invite_code_student = v_code THEN
    v_code_type := 'student';
    v_account_type := 'personal';
    v_role := 'common_user';
    v_member_role := 'student';
  ELSE
    v_code_type := 'staff';
    v_account_type := 'sub_business';
    v_role := 'organization_admin';
    v_member_role := 'teacher';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'PROFILE_ALREADY_EXISTS';
  END IF;

  v_young_key := public.generate_young_key(p_full_name, v_account_type);

  INSERT INTO public.profiles (
    id, email, display_name, full_name, young_key, account_type, role, status,
    birth_date, country, state, city, sport, about, hobby, invited_by_org_id
  ) VALUES (
    p_user_id, lower(trim(p_email)), trim(p_full_name), trim(p_full_name), v_young_key,
    v_account_type, v_role, 'pending',
    p_birth_date, trim(p_country), trim(p_state), trim(p_city),
    trim(p_sport), trim(p_about), trim(p_hobby), v_org.id
  ) RETURNING * INTO v_profile;

  IF v_code_type = 'student' THEN
    INSERT INTO public.wallets (profile_id, wallet_type, status)
    VALUES (v_profile.id, 'personal', 'pending')
    RETURNING * INTO v_wallet;
  END IF;

  INSERT INTO public.organization_members (organization_id, profile_id, member_role, status)
  VALUES (v_org.id, v_profile.id, v_member_role, 'pending')
  ON CONFLICT (organization_id, profile_id) DO UPDATE
    SET member_role = v_member_role, status = 'pending';

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id, after_data, metadata, ip_address, user_agent
  ) VALUES (
    p_user_id, 'profile.registered_via_invite', 'profile', v_profile.id,
    to_jsonb(v_profile),
    jsonb_build_object(
      'invite_code', v_code,
      'code_type', v_code_type,
      'organization_id', v_org.id,
      'organization_name', v_org.name,
      'member_role', v_member_role
    ),
    p_ip_address, p_user_agent
  );

  RETURN QUERY SELECT v_profile, v_wallet;
END;
$function$;

-- A7. Aprovar ou rejeitar cadastro
CREATE OR REPLACE FUNCTION public.approve_or_reject_registration(
  p_actor_id uuid,
  p_profile_id uuid,
  p_approved boolean,
  p_reason text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile public.profiles;
  v_new_status text;
BEGIN
  IF NOT public.is_bank_admin(p_actor_id) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;
  IF v_profile.status != 'pending' THEN
    RAISE EXCEPTION 'PROFILE_NOT_PENDING';
  END IF;

  IF p_approved THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'blocked';
  END IF;

  UPDATE public.profiles SET status = v_new_status WHERE id = p_profile_id
  RETURNING * INTO v_profile;

  UPDATE public.wallets SET status = v_new_status
  WHERE profile_id = p_profile_id AND status = 'pending';

  UPDATE public.organization_members SET status = v_new_status
  WHERE profile_id = p_profile_id AND status = 'pending';

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id,
    CASE WHEN p_approved THEN 'registration.approved' ELSE 'registration.rejected' END,
    'profile', p_profile_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', v_new_status),
    jsonb_build_object('reason', p_reason, 'organization_id', v_profile.invited_by_org_id),
    p_ip_address, p_user_agent
  );

  RETURN v_profile;
END;
$function$;

-- A8. Transferencia da conta da escola (colaborador)
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
  -- Idempotencia
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) >= 8 THEN
    SELECT * INTO v_existing FROM public.transactions WHERE idempotency_key = trim(p_idempotency_key);
    IF v_existing.id IS NOT NULL THEN
      RETURN v_existing;
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;

  -- Validar valor
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount != round(p_amount, 2) THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- Verificar que actor e colaborador ativo
  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id AND status = 'active';
  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'ACTOR_NOT_FOUND';
  END IF;

  SELECT * INTO v_membership
  FROM public.organization_members
  WHERE profile_id = p_actor_id
    AND member_role IN ('teacher', 'staff', 'admin')
    AND status = 'active'
  LIMIT 1;

  IF v_membership.id IS NULL THEN
    RAISE EXCEPTION 'NOT_A_COLLABORATOR';
  END IF;

  -- Buscar wallet business da organizacao
  SELECT * INTO v_org_wallet
  FROM public.wallets
  WHERE organization_id = v_membership.organization_id
    AND wallet_type = 'business'
    AND status = 'active'
  FOR UPDATE;

  IF v_org_wallet.id IS NULL THEN
    RAISE EXCEPTION 'ORG_WALLET_NOT_FOUND';
  END IF;

  -- Buscar destinatario
  SELECT * INTO v_to_profile
  FROM public.profiles
  WHERE young_key = lower(trim(p_to_young_key)) AND status = 'active';

  IF v_to_profile.id IS NULL THEN
    RAISE EXCEPTION 'DESTINATION_NOT_FOUND';
  END IF;

  SELECT * INTO v_to_wallet
  FROM public.wallets
  WHERE profile_id = v_to_profile.id AND status = 'active'
  FOR UPDATE;

  IF v_to_wallet.id IS NULL THEN
    RAISE EXCEPTION 'DESTINATION_WALLET_NOT_FOUND';
  END IF;

  IF v_org_wallet.id = v_to_wallet.id THEN
    RAISE EXCEPTION 'SELF_TRANSFER_BLOCKED';
  END IF;

  -- Limites (usa limites de business)
  SELECT * INTO v_limits FROM public.transfer_limits WHERE account_type = 'business';
  IF v_limits.id IS NOT NULL THEN
    IF p_amount > v_limits.transaction_limit THEN
      INSERT INTO public.security_events (profile_id, event_type, severity, metadata)
      VALUES (p_actor_id, 'org_transfer.transaction_limit_exceeded', 'medium',
        jsonb_build_object('amount', p_amount, 'limit', v_limits.transaction_limit));
      RAISE EXCEPTION 'TRANSACTION_LIMIT_EXCEEDED';
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
    FROM public.transactions
    WHERE from_wallet_id = v_org_wallet.id
      AND status = 'completed'
      AND type IN ('transfer', 'payment')
      AND created_at >= date_trunc('day', now());

    IF v_daily_total + p_amount > v_limits.daily_limit THEN
      RAISE EXCEPTION 'DAILY_LIMIT_EXCEEDED';
    END IF;

    SELECT COUNT(*) INTO v_minute_count
    FROM public.transactions
    WHERE from_wallet_id = v_org_wallet.id
      AND created_at >= now() - interval '1 minute';

    IF v_minute_count >= v_limits.minute_limit THEN
      RAISE EXCEPTION 'RATE_LIMITED';
    END IF;
  END IF;

  -- Saldo
  IF v_org_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;

  -- Executar transferencia
  UPDATE public.wallets SET balance = balance - p_amount WHERE id = v_org_wallet.id;
  UPDATE public.wallets SET balance = balance + p_amount WHERE id = v_to_wallet.id;

  INSERT INTO public.transactions (
    idempotency_key, from_wallet_id, to_wallet_id, amount, type, status,
    description, created_by, metadata
  ) VALUES (
    trim(p_idempotency_key), v_org_wallet.id, v_to_wallet.id, p_amount,
    'transfer', 'completed', p_description, p_actor_id,
    jsonb_build_object(
      'collaborator_name', v_actor.display_name,
      'collaborator_young_key', v_actor.young_key,
      'collaborator_role', v_membership.member_role,
      'organization_id', v_membership.organization_id
    )
  ) RETURNING * INTO v_tx;

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id, after_data, metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'transaction.org_transfer_completed', 'transaction', v_tx.id,
    to_jsonb(v_tx),
    jsonb_build_object(
      'from_org_wallet', v_org_wallet.id,
      'to_young_key', p_to_young_key,
      'collaborator', v_actor.display_name
    ),
    p_ip_address, p_user_agent
  );

  RETURN v_tx;
END;
$function$;

-- A9. Atualizar view enriched_transactions com created_by
DROP VIEW IF EXISTS public.enriched_transactions;
CREATE VIEW public.enriched_transactions AS
SELECT
  t.*,
  fp.display_name AS from_display_name,
  fp.young_key AS from_young_key,
  fp.account_type AS from_account_type,
  fp.role AS from_role,
  tp.display_name AS to_display_name,
  tp.young_key AS to_young_key,
  tp.account_type AS to_account_type,
  tp.role AS to_role,
  cp.display_name AS created_by_display_name,
  cp.young_key AS created_by_young_key
FROM public.transactions t
LEFT JOIN public.wallets fw ON fw.id = t.from_wallet_id
LEFT JOIN public.profiles fp ON fp.id = fw.profile_id
LEFT JOIN public.wallets tw ON tw.id = t.to_wallet_id
LEFT JOIN public.profiles tp ON tp.id = tw.profile_id
LEFT JOIN public.profiles cp ON cp.id = t.created_by;

-- A10. View: alunos com saldo por escola
CREATE OR REPLACE VIEW public.org_students_with_balance AS
SELECT
  om.organization_id,
  o.name AS organization_name,
  p.id AS profile_id,
  p.display_name,
  p.full_name,
  p.young_key,
  p.account_type,
  p.status,
  p.birth_date,
  COALESCE(w.balance, 0) AS balance,
  COALESCE(w.status, 'none') AS wallet_status,
  om.member_role,
  om.created_at AS member_since
FROM public.organization_members om
JOIN public.profiles p ON p.id = om.profile_id
JOIN public.organizations o ON o.id = om.organization_id
LEFT JOIN public.wallets w ON w.profile_id = p.id;

-- A11. RLS para org_students_with_balance
ALTER VIEW public.org_students_with_balance SET (security_invoker = on);

-- Permitir profiles INSERT para cadastro via convite (RPC SECURITY DEFINER ja bypassa, mas garantir)
-- A funcao register_with_invite ja e SECURITY DEFINER, entao nao precisa de RLS extra

-- Permitir leitura de profiles pendentes pelo bank_admin (ja coberto pela policy existente)
-- Permitir leitura do enriched_transactions (ja coberto)

-- Garantir que colaboradores possam ler a wallet da escola (ja coberto por is_active_member_of_org)
