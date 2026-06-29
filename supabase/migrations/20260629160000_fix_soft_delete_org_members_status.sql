-- Corrige soft-delete para bloquear acesso no app mobile:
-- 1. Adiciona 'deleted' ao status de organization_members
-- 2. Atualiza soft_delete_organization para marcar membros na tabela de vínculos

ALTER TABLE public.organization_members DROP CONSTRAINT organization_members_status_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_status_check
  CHECK (status = ANY (ARRAY['active','blocked','pending','deleted']));

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

    -- Marca vínculos como deleted para bloquear org_wallet_summary
    UPDATE public.organization_members
    SET status = 'deleted'
    WHERE organization_id = p_org_id AND status != 'deleted';
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

REVOKE EXECUTE ON FUNCTION public.soft_delete_organization(uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_organization(uuid, uuid, text, text) FROM authenticated;
