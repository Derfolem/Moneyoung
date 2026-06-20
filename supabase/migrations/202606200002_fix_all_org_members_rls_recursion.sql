-- Fix ALL policies that reference organization_members to eliminate recursion.
-- Strategy: use SECURITY DEFINER functions for cross-table org membership checks.

-- 1. Create helper to check org membership (bypasses RLS)
CREATE OR REPLACE FUNCTION is_member_of_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND profile_id = auth.uid()
  );
$$;

-- 2. Create helper to check active org membership (bypasses RLS)
CREATE OR REPLACE FUNCTION is_active_member_of_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND profile_id = auth.uid()
    AND status = 'active'
  );
$$;

-- 3. Fix organization_members SELECT policy (remove is_org_admin self-reference too)
DROP POLICY IF EXISTS "organization members read own orgs or admin" ON organization_members;
CREATE POLICY "organization members read own orgs or admin"
ON organization_members
FOR SELECT
USING (
  is_bank_admin()
  OR profile_id = auth.uid()
);

-- 4. Fix organizations SELECT policy
DROP POLICY IF EXISTS "organizations read members or admin" ON organizations;
CREATE POLICY "organizations read members or admin"
ON organizations
FOR SELECT
USING (
  is_bank_admin()
  OR is_member_of_org(id)
);

-- 5. Fix wallets SELECT policy
DROP POLICY IF EXISTS "wallets read own orgs or bank admin" ON wallets;
CREATE POLICY "wallets read own orgs or bank admin"
ON wallets
FOR SELECT
USING (
  profile_id = auth.uid()
  OR is_bank_admin()
  OR is_active_member_of_org(organization_id)
);
