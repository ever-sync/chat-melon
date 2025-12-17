-- Fix companies RLS policy to allow users to view companies they belong to
DROP POLICY IF EXISTS "Only admins can view full company data" ON companies;

DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
CREATE POLICY "Users can view companies they belong to"
ON companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_users 
    WHERE company_users.user_id = auth.uid() 
    AND company_users.company_id = companies.id
  )
);