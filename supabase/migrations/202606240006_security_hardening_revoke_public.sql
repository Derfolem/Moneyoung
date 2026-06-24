-- Revogar EXECUTE de PUBLIC (default) em todas as RPCs SECURITY DEFINER
-- Isso remove o acesso herdado por anon e authenticated

-- Admin-only: ninguem via PostgREST (apenas service_role via Edge Functions)
REVOKE ALL ON FUNCTION public.admin_credit_wallet(uuid, uuid, numeric, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.approve_or_reject_registration(uuid, uuid, boolean, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.block_wallet_tx(uuid, uuid, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.create_organization_account_tx(uuid, text, text, text, uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION public.create_organization_account_tx(uuid, text, text, uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION public.reverse_transaction_tx(uuid, uuid, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.process_cancellation(uuid, uuid, boolean, text, text) FROM public;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM public;

-- User-facing: revogar de public
REVOKE ALL ON FUNCTION public.transfer_youngcoin_tx(uuid, text, numeric, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.transfer_from_org_wallet(uuid, text, numeric, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.register_with_invite(uuid, text, text, date, text, text, text, text, text, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.request_account_cancellation(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.create_profile_and_wallet(uuid, text, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.current_profile() FROM public;
REVOKE ALL ON FUNCTION public.generate_invite_code() FROM public;
REVOKE ALL ON FUNCTION public.validate_invite_code(text) FROM public;

-- Helpers RLS: revogar de public
REVOKE ALL ON FUNCTION public.is_bank_admin(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_member_of_org(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_active_member_of_org(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid) FROM public;

-- Re-conceder EXECUTE a authenticated nos helpers RLS e funcoes de usuario
GRANT EXECUTE ON FUNCTION public.is_bank_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_of_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_member_of_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_youngcoin_tx(uuid, text, numeric, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_from_org_wallet(uuid, text, numeric, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_with_invite(uuid, text, text, date, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_cancellation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_and_wallet(uuid, text, text, text, text, text) TO authenticated;
