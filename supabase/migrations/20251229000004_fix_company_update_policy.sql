-- Fix company update policy to allow company admins and members to update
-- Previously only the creator (created_by) could update

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
DROP POLICY IF EXISTS "Admins can update their companies" ON companies;
DROP POLICY IF EXISTS "Company admins can update" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;

-- Create a comprehensive UPDATE policy that allows:
-- 1. The company creator (created_by)
-- 2. Users with admin role in the company (via user_roles table)
-- 3. Company members (via company_users table)
CREATE POLICY "Company admins can update their company"
ON companies FOR UPDATE
TO authenticated
USING (
  -- Creator can always update
  auth.uid() = created_by
  OR
  -- Company users with admin role can update (via user_roles table)
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.company_id = companies.id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin')
  )
  OR
  -- Any company member can update (via company_users table)
  EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = companies.id
    AND cu.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = created_by
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.company_id = companies.id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = companies.id
    AND cu.user_id = auth.uid()
  )
);

-- Comment explaining the policy
COMMENT ON POLICY "Company admins can update their company" ON companies IS
  'Allows company creators, company admins, and company members to update company data including social_links';
