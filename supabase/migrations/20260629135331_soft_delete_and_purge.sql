-- Migration: soft_delete_and_purge
-- Adds 'deleted' status to wallets and organizations, deleted_at columns,
-- and three SECURITY DEFINER RPCs for soft-delete and hard-purge operations.

-- ── Status constraints ──────────────────────────────────────────────────────

ALTER TABLE public.wallets DROP CONSTRAINT wallets_status_check;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_status_check
  CHECK (status = ANY (ARRAY['active','blocked','frozen','pending','deleted']));

ALTER TABLE public.organizations DROP CONSTRAINT organizations_status_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_status_check
  CHECK (status = ANY (ARRAY['active','blocked','pending','deleted']));

-- ── Timestamps ───────────────────────────────────────────────────────────────

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── RPC: soft_delete_organization ───────────────────────────────────────────
-- Marks an org + all its members + wallets as deleted.
-- Transactions remain intact and visible to bank admins.

CREATE OR REPLACE FUNCTION public.soft_delete_organization(
  p_org_id      uuid,
  p_actor_id    uuid,
  p_ip_address  text DEFAULT NULL,
  p_user_agent  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor      public.profiles%ROWTYPE;
  v_org        public.organizations%ROWTYPE;
  v_member_ids uuid[];
BEGIN
  SELECT * INTO v_actor FROM public.profiles
  WHERE id = p_actor_id AND role IN ('bank_admin','super_admin') AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FORBIDDEN: Apenas administradores do banco podem excluir escolas.';
  END IF;

  SELECT * INTO v_org FROM public.organizations WHERE id = p_org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Escola nao encontrada.';
  END IF;

  SELECT ARRAY_AGG(DISTINCT profile_id) INTO v_member_ids
  FROM public.organization_members WHERE organization_id = p_org_id;

  IF v_member_ids IS NOT NULL AND array_length(v_member_ids, 1) > 0 THEN
    UPDATE public.profiles
    SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
    WHERE id = ANY(v_member_ids) AND status != 'deleted';

    UPDATE public.wallets
    SET status = 'deleted', updated_at = NOW()
    WHERE profile_id = ANY(v_member_ids) AND status != 'deleted';
  END IF;

  UPDATE public.wallets SET status = 'deleted', updated_at = NOW()
  WHERE organization_id = p_org_id AND status != 'deleted';

  UPDATE public.organizations
  SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_org_id;

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id,
    before_data, after_data, metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'organization.soft_deleted', 'organization', p_org_id,
    to_jsonb(v_org),
    jsonb_build_object('status','deleted','deleted_at',NOW()),
    jsonb_build_object('members_deleted', array_length(v_member_ids, 1)),
    p_ip_address, p_user_agent
  );

  RETURN jsonb_build_object(
    'organization_id', p_org_id,
    'members_deleted', COALESCE(array_length(v_member_ids, 1), 0)
  );
END;
$$;

-- ── RPC: hard_purge_organization ────────────────────────────────────────────
-- Permanently deletes ALL data for an org and its members.
-- FK order: nullify transaction refs → delete security_events/audit_logs
-- → nullify org owner → delete wallets → delete org (cascade members)
-- → delete member profiles (cascade their wallets/members).

CREATE OR REPLACE FUNCTION public.hard_purge_organization(
  p_org_id      uuid,
  p_actor_id    uuid,
  p_ip_address  text DEFAULT NULL,
  p_user_agent  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor      public.profiles%ROWTYPE;
  v_org        public.organizations%ROWTYPE;
  v_member_ids uuid[];
  v_wallet_ids uuid[];
BEGIN
  SELECT * INTO v_actor FROM public.profiles
  WHERE id = p_actor_id AND role IN ('bank_admin','super_admin') AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FORBIDDEN: Apenas administradores do banco podem limpar dados.';
  END IF;

  SELECT * INTO v_org FROM public.organizations WHERE id = p_org_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Escola nao encontrada.';
  END IF;

  SELECT ARRAY_AGG(DISTINCT profile_id) INTO v_member_ids
  FROM public.organization_members WHERE organization_id = p_org_id;

  SELECT ARRAY_AGG(id) INTO v_wallet_ids FROM public.wallets
  WHERE organization_id = p_org_id
     OR (v_member_ids IS NOT NULL AND profile_id = ANY(v_member_ids));

  IF v_wallet_ids IS NOT NULL AND array_length(v_wallet_ids, 1) > 0 THEN
    UPDATE public.transactions SET from_wallet_id = NULL WHERE from_wallet_id = ANY(v_wallet_ids);
    UPDATE public.transactions SET to_wallet_id   = NULL WHERE to_wallet_id   = ANY(v_wallet_ids);
  END IF;

  IF v_member_ids IS NOT NULL AND array_length(v_member_ids, 1) > 0 THEN
    UPDATE public.transactions SET created_by = NULL WHERE created_by = ANY(v_member_ids);
    DELETE FROM public.security_events WHERE profile_id = ANY(v_member_ids);
    DELETE FROM public.audit_logs       WHERE actor_profile_id = ANY(v_member_ids);
  END IF;

  UPDATE public.organizations SET owner_profile_id = NULL WHERE id = p_org_id;
  DELETE FROM public.wallets       WHERE organization_id = p_org_id;
  DELETE FROM public.organizations WHERE id = p_org_id;

  IF v_member_ids IS NOT NULL AND array_length(v_member_ids, 1) > 0 THEN
    DELETE FROM public.profiles WHERE id = ANY(v_member_ids);
  END IF;

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id,
    metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'organization.purged', 'organization', p_org_id,
    jsonb_build_object('name', v_org.name, 'members', array_length(v_member_ids, 1)),
    p_ip_address, p_user_agent
  );

  RETURN jsonb_build_object('purged', true, 'name', v_org.name);
END;
$$;

-- ── RPC: hard_purge_profile ─────────────────────────────────────────────────
-- Permanently deletes a single profile and all its data.

CREATE OR REPLACE FUNCTION public.hard_purge_profile(
  p_profile_id  uuid,
  p_actor_id    uuid,
  p_ip_address  text DEFAULT NULL,
  p_user_agent  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor      public.profiles%ROWTYPE;
  v_profile    public.profiles%ROWTYPE;
  v_wallet_ids uuid[];
BEGIN
  SELECT * INTO v_actor FROM public.profiles
  WHERE id = p_actor_id AND role IN ('bank_admin','super_admin') AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FORBIDDEN: Apenas administradores do banco podem limpar dados.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Perfil nao encontrado.';
  END IF;

  SELECT ARRAY_AGG(id) INTO v_wallet_ids FROM public.wallets WHERE profile_id = p_profile_id;

  IF v_wallet_ids IS NOT NULL AND array_length(v_wallet_ids, 1) > 0 THEN
    UPDATE public.transactions SET from_wallet_id = NULL WHERE from_wallet_id = ANY(v_wallet_ids);
    UPDATE public.transactions SET to_wallet_id   = NULL WHERE to_wallet_id   = ANY(v_wallet_ids);
  END IF;

  UPDATE public.transactions  SET created_by        = NULL WHERE created_by        = p_profile_id;
  UPDATE public.organizations SET owner_profile_id  = NULL WHERE owner_profile_id  = p_profile_id;
  DELETE FROM public.security_events WHERE profile_id       = p_profile_id;
  DELETE FROM public.audit_logs      WHERE actor_profile_id = p_profile_id;
  DELETE FROM public.profiles        WHERE id               = p_profile_id;

  INSERT INTO public.audit_logs (
    actor_profile_id, action, entity_type, entity_id,
    metadata, ip_address, user_agent
  ) VALUES (
    p_actor_id, 'profile.purged', 'profile', p_profile_id,
    jsonb_build_object('email', v_profile.email, 'young_key', v_profile.young_key),
    p_ip_address, p_user_agent
  );

  RETURN jsonb_build_object('purged', true);
END;
$$;

-- ── Segurança: revogar acesso direto ────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.soft_delete_organization(uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_organization(uuid, uuid, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.hard_purge_organization(uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.hard_purge_organization(uuid, uuid, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.hard_purge_profile(uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.hard_purge_profile(uuid, uuid, text, text) FROM authenticated;
