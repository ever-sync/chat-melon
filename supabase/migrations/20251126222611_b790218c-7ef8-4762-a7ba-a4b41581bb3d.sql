-- Fix circular RLS policy on platform_admins table
-- The issue: is_platform_admin() function needs to read platform_admins table,
-- but the RLS policy blocks access unless user is already verified as admin

-- Drop the old policy that causes infinite recursion
DROP POLICY IF EXISTS "Platform admins can view all admins" ON platform_admins;

-- Create new policy: users can view their own admin status
-- This breaks the circular dependency
CREATE POLICY "Users can view their own admin status" 
ON platform_admins 
FOR SELECT 
USING (user_id = auth.uid());

-- Re-create admin policy: now it works because is_platform_admin() can read the user's own record
CREATE POLICY "Platform admins can view all admins" 
ON platform_admins 
FOR SELECT 
USING (is_platform_admin(auth.uid()));

-- Keep existing policies for INSERT/UPDATE/DELETE (admin-only)
-- These already exist and work correctly