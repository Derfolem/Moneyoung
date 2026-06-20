-- Fix: infinite recursion in organization_members RLS policy
-- The SELECT policy on organization_members references itself to check org admin status.
-- Solution: create a SECURITY DEFINER function that bypasses RLS for the check.

-- 1. Create helper function (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
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
    AND member_role = 'admin'
  );
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "organization members read own orgs or admin" ON organization_members;

-- 3. Recreate without self-reference (uses the SECURITY DEFINER function instead)
CREATE POLICY "organization members read own orgs or admin"
ON organization_members
FOR SELECT
USING (
  is_bank_admin()
  OR profile_id = auth.uid()
  OR is_org_admin(organization_id)
);
