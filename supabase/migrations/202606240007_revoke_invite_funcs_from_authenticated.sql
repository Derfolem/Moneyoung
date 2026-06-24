-- Revogar EXECUTE de authenticated em funcoes internas de convite
-- Estas funcoes sao chamadas apenas via Edge Functions (service_role)
REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_invite_code(text) FROM authenticated;
