-- ============================================================
-- HARDENING DE SEGURANCA — Supabase Advisors
-- ============================================================

-- 1. REVOGAR EXECUTE de anon em TODAS as RPCs sensiveis
REVOKE EXECUTE ON FUNCTION public.admin_credit_wallet(uuid, uuid, numeric, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_or_reject_registration(uuid, uuid, boolean, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.block_wallet_tx(uuid, uuid, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_organization_account_tx(uuid, text, text, text, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_organization_account_tx(uuid, text, text, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_profile_and_wallet(uuid, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_active_member_of_org(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_bank_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_member_of_org(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_cancellation(uuid, uuid, boolean, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_with_invite(uuid, text, text, date, text, text, text, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_account_cancellation(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reverse_transaction_tx(uuid, uuid, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_from_org_wallet(uuid, text, numeric, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_youngcoin_tx(uuid, text, numeric, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_invite_code(text) FROM anon;

-- 2. REVOGAR EXECUTE de authenticated em funcoes somente-admin
REVOKE EXECUTE ON FUNCTION public.admin_credit_wallet(uuid, uuid, numeric, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_or_reject_registration(uuid, uuid, boolean, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.block_wallet_tx(uuid, uuid, text, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_organization_account_tx(uuid, text, text, text, uuid, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_organization_account_tx(uuid, text, text, uuid, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_transaction_tx(uuid, uuid, text, text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.process_cancellation(uuid, uuid, boolean, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 3. FIXAR search_path em funcoes com search_path mutable
ALTER FUNCTION public.account_type_label(text) SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_young_key(text) SET search_path = public;
ALTER FUNCTION public.generate_young_key(text, text) SET search_path = public;

-- 4. OTIMIZAR RLS POLICIES — (select auth.uid()) em vez de auth.uid()
DROP POLICY IF EXISTS "profiles read own or bank admin" ON profiles;
CREATE POLICY "profiles read own or bank admin" ON profiles
  FOR SELECT USING (
    id = (select auth.uid()) OR is_bank_admin()
  );

DROP POLICY IF EXISTS "profiles update own basic" ON profiles;
CREATE POLICY "profiles update own basic" ON profiles
  FOR UPDATE USING (
    id = (select auth.uid())
  ) WITH CHECK (
    id = (select auth.uid())
    AND role = (SELECT p.role FROM profiles p WHERE p.id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "transactions read participant or admin" ON transactions;
CREATE POLICY "transactions read participant or admin" ON transactions
  FOR SELECT USING (
    is_bank_admin() OR EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.profile_id = (select auth.uid())
      AND (w.id = transactions.from_wallet_id OR w.id = transactions.to_wallet_id)
    )
  );

DROP POLICY IF EXISTS "transfer limits read authenticated" ON transfer_limits;
CREATE POLICY "transfer limits read authenticated" ON transfer_limits
  FOR SELECT USING (
    (select auth.role()) = 'authenticated'
  );

DROP POLICY IF EXISTS "organization members read own orgs or admin" ON organization_members;
CREATE POLICY "organization members read own orgs or admin" ON organization_members
  FOR SELECT USING (
    is_bank_admin() OR profile_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "wallets read own orgs or bank admin" ON wallets;
CREATE POLICY "wallets read own orgs or bank admin" ON wallets
  FOR SELECT USING (
    profile_id = (select auth.uid())
    OR is_bank_admin()
    OR is_active_member_of_org(organization_id)
  );

-- 5. INDICES em foreign keys sem cobertura
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_profile_id ON audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_profile_id ON organization_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_profile_id ON organizations(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by_org_id ON profiles(invited_by_org_id);
CREATE INDEX IF NOT EXISTS idx_security_events_profile_id ON security_events(profile_id);
