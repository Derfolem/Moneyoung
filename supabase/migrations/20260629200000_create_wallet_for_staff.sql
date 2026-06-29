-- Colaboradores (sub_business) não recebiam carteira pessoal no cadastro.
-- Isso impedia que alunos transferissem YC para eles.
-- Esta migration:
-- 1. Cria carteiras sub_business para colaboradores já existentes sem wallet
-- 2. Atualiza register_with_invite para criar wallet para staff no cadastro

-- 1. Criar wallets para colaboradores existentes sem wallet
INSERT INTO public.wallets (profile_id, wallet_type, status, balance)
SELECT p.id, 'sub_business', p.status, 0
FROM public.profiles p
WHERE p.account_type = 'sub_business'
  AND NOT EXISTS (
    SELECT 1 FROM public.wallets w WHERE w.profile_id = p.id
  );

-- 2. Atualizar register_with_invite para criar wallet para staff
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
  v_org          public.organizations;
  v_code         text;
  v_code_type    text;
  v_account_type text;
  v_role         text;
  v_member_role  text;
  v_profile      public.profiles;
  v_wallet       public.wallets;
  v_young_key    text;
  v_is_deleted   boolean := FALSE;
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
    v_code_type    := 'student';
    v_account_type := 'personal';
    v_role         := 'common_user';
    v_member_role  := 'student';
  ELSE
    v_code_type    := 'staff';
    v_account_type := 'sub_business';
    v_role         := 'organization_admin';
    v_member_role  := 'teacher';
  END IF;

  -- Verifica se perfil já existe e se é deletado (re-cadastro permitido)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND status = 'deleted') THEN
      v_is_deleted := TRUE;
    ELSE
      RAISE EXCEPTION 'PROFILE_ALREADY_EXISTS';
    END IF;
  END IF;

  v_young_key := public.generate_young_key(p_full_name, v_account_type);

  IF v_is_deleted THEN
    -- Reativa o perfil deletado com novos dados
    UPDATE public.profiles SET
      display_name              = trim(p_full_name),
      full_name                 = trim(p_full_name),
      young_key                 = v_young_key,
      account_type              = v_account_type,
      role                      = v_role,
      status                    = 'pending',
      birth_date                = p_birth_date,
      country                   = trim(p_country),
      state                     = trim(p_state),
      city                      = trim(p_city),
      sport                     = trim(p_sport),
      about                     = trim(p_about),
      hobby                     = trim(p_hobby),
      invited_by_org_id         = v_org.id,
      deleted_at                = NULL,
      cancellation_requested_at = NULL,
      updated_at                = NOW()
    WHERE id = p_user_id
    RETURNING * INTO v_profile;

    -- Reativa wallet existente (preserva ID para manter histórico de transações)
    UPDATE public.wallets SET
      wallet_type = v_account_type,
      status      = 'pending',
      updated_at  = NOW()
    WHERE profile_id = p_user_id
    RETURNING * INTO v_wallet;

    -- Se não tinha wallet (aluno ou colaborador sem wallet), cria agora
    IF v_wallet.id IS NULL THEN
      INSERT INTO public.wallets (profile_id, wallet_type, status)
      VALUES (p_user_id, v_account_type, 'pending')
      RETURNING * INTO v_wallet;
    END IF;

    -- Marca vínculos antigos como deleted e cria novo vínculo
    UPDATE public.organization_members
    SET status = 'deleted'
    WHERE profile_id = p_user_id AND status != 'deleted';

    INSERT INTO public.organization_members (organization_id, profile_id, member_role, status)
    VALUES (v_org.id, v_profile.id, v_member_role, 'pending')
    ON CONFLICT (organization_id, profile_id) DO UPDATE
      SET member_role = v_member_role, status = 'pending';

  ELSE
    -- Novo perfil (aluno ou colaborador)
    INSERT INTO public.profiles (
      id, email, display_name, full_name, young_key, account_type, role, status,
      birth_date, country, state, city, sport, about, hobby, invited_by_org_id
    ) VALUES (
      p_user_id, lower(trim(p_email)), trim(p_full_name), trim(p_full_name), v_young_key,
      v_account_type, v_role, 'pending',
      p_birth_date, trim(p_country), trim(p_state), trim(p_city),
      trim(p_sport), trim(p_about), trim(p_hobby), v_org.id
    ) RETURNING * INTO v_profile;

    -- Cria wallet para aluno (personal) e para colaborador (sub_business)
    INSERT INTO public.wallets (profile_id, wallet_type, status)
    VALUES (v_profile.id, v_account_type, 'pending')
    RETURNING * INTO v_wallet;

    INSERT INTO public.organization_members (organization_id, profile_id, member_role, status)
    VALUES (v_org.id, v_profile.id, v_member_role, 'pending')
    ON CONFLICT (organization_id, profile_id) DO UPDATE
      SET member_role = v_member_role, status = 'pending';
  END IF;

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id, after_data, metadata, ip_address, user_agent
  ) VALUES (
    p_user_id,
    CASE WHEN v_is_deleted THEN 'profile.reactivated_via_invite' ELSE 'profile.registered_via_invite' END,
    'profile', v_profile.id,
    to_jsonb(v_profile),
    jsonb_build_object(
      'invite_code', v_code, 'code_type', v_code_type,
      'organization_id', v_org.id, 'organization_name', v_org.name,
      'member_role', v_member_role, 'reactivated', v_is_deleted
    ),
    p_ip_address, p_user_agent
  );

  RETURN QUERY SELECT v_profile, v_wallet;
END;
$function$;
