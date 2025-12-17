-- Combined migration for company creation fixes
-- This migration adds the missing deleted_at column and RLS policies

-- 1. Add deleted_at column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at);

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;

-- 3. Create INSERT policy: Allow authenticated users to create companies
DROP POLICY IF EXISTS "Users can create companies" ON companies;
CREATE POLICY "Users can create companies"
ON companies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- 4. Create SELECT policy: Allow users to view companies they created or are members of
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
CREATE POLICY "Users can view their companies"
ON companies FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by 
  OR 
  EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = companies.id
    AND cu.user_id = auth.uid()
  )
);

-- 5. Create UPDATE policy: Allow users to update companies they created
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
CREATE POLICY "Users can update their companies"
ON companies FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Comments
COMMENT ON COLUMN companies.deleted_at IS 'Timestamp when the company was soft-deleted';
COMMENT ON POLICY "Users can create companies" ON companies IS 'Allows authenticated users to create companies';
COMMENT ON POLICY "Users can view their companies" ON companies IS 'Allows users to view companies they created or are members of';
COMMENT ON POLICY "Users can update their companies" ON companies IS 'Allows users to update companies they created';
