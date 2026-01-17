-- Standardize RLS for Conversations and Messages
-- This migration switches the authoritative table for company membership in RLS from company_users to company_members
-- company_members is more robust as it includes role and activity status.

-- PART 1: Conversations Table RLS
DROP POLICY IF EXISTS "Users can view conversations in their company" ON conversations;
DROP POLICY IF EXISTS "Enable read access for company members" ON conversations;

CREATE POLICY "Standardized view conversations" ON conversations
FOR SELECT USING (
  company_id IN (
    SELECT company_id 
    FROM company_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- PART 2: Messages Table RLS
DROP POLICY IF EXISTS "Users can view messages in their company conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages of their company" ON messages;
DROP POLICY IF EXISTS "Enable read access for company members" ON messages;

CREATE POLICY "Standardized view messages" ON messages
FOR SELECT USING (
  company_id IN (
    SELECT company_id 
    FROM company_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- PART 3: Profiles Table RLS (Ensure permissive for joins)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- PART 4: Company Members Table RLS (Ensure agents can read their own membership)
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own memberships" ON company_members;
CREATE POLICY "Users can view their own memberships" ON company_members
FOR SELECT USING (user_id = auth.uid());
