-- Fix infinite recursion in RLS policy for company_members
-- 1) Ensure RLS is enabled
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 2) Drop existing policies on company_members to remove recursive definitions
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'company_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.company_members', r.policyname);
  END LOOP;
END;
$$;

-- 3) Create helper function to check member role without recursion
CREATE OR REPLACE FUNCTION public.check_member_role(_user_id uuid, _company_id uuid, _required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.user_id = _user_id
      AND cm.company_id = _company_id
      AND cm.role = _required_role
      AND cm.is_active = true
  )
$$;

-- 4) Recreate safe, non-recursive policies

-- Allow authenticated users to see members of companies they belong to
CREATE POLICY company_members_select
ON public.company_members
FOR SELECT
TO authenticated
USING (
  public.user_has_access_to_company(auth.uid(), company_id)
);

-- Allow admins and managers to insert members for their companies
CREATE POLICY company_members_insert_admin
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.check_member_role(auth.uid(), company_id, 'admin')
  OR public.check_member_role(auth.uid(), company_id, 'manager')
);

-- Allow admins and managers to update members for their companies
CREATE POLICY company_members_update_admin
ON public.company_members
FOR UPDATE
TO authenticated
USING (
  public.check_member_role(auth.uid(), company_id, 'admin')
  OR public.check_member_role(auth.uid(), company_id, 'manager')
)
WITH CHECK (
  public.check_member_role(auth.uid(), company_id, 'admin')
  OR public.check_member_role(auth.uid(), company_id, 'manager')
);

-- Allow admins to delete members for their companies
CREATE POLICY company_members_delete_admin
ON public.company_members
FOR DELETE
TO authenticated
USING (
  public.check_member_role(auth.uid(), company_id, 'admin')
);