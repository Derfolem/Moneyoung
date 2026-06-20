-- Allow bank_admin to delete organizations
CREATE POLICY "organizations delete bank admin"
ON organizations
FOR DELETE
USING (is_bank_admin());

-- Allow bank_admin to delete organization members (unlink)
CREATE POLICY "organization members delete bank admin"
ON organization_members
FOR DELETE
USING (is_bank_admin());

-- Allow bank_admin to insert organizations (needed for create via client)
CREATE POLICY "organizations insert bank admin"
ON organizations
FOR INSERT
WITH CHECK (is_bank_admin());

-- Allow bank_admin to update organizations
CREATE POLICY "organizations update bank admin"
ON organizations
FOR UPDATE
USING (is_bank_admin())
WITH CHECK (is_bank_admin());
