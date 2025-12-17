-- Fix infinite recursion in RLS policies across multiple tables
-- Create SECURITY DEFINER helper function to get user's company IDs without recursion

CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(company_id)
  FROM public.company_members
  WHERE user_id = _user_id AND is_active = true
$$;

-- ============================================
-- 1. FIX ai_settings TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can manage AI settings for their company" ON public.ai_settings;

DROP POLICY IF EXISTS "Users can manage AI settings for their company" ON public;
CREATE POLICY "Users can manage AI settings for their company"
ON public.ai_settings
FOR ALL
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())))
WITH CHECK (company_id = ANY(public.get_user_company_ids(auth.uid())));

-- ============================================
-- 2. FIX ai_metrics_daily TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view metrics for their company" ON public.ai_metrics_daily;

DROP POLICY IF EXISTS "Users can view metrics for their company" ON public;
CREATE POLICY "Users can view metrics for their company"
ON public.ai_metrics_daily
FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

-- ============================================
-- 3. FIX ai_suggestions TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view suggestions for their company" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users can update suggestions for their company" ON public.ai_suggestions;

DROP POLICY IF EXISTS "Users can view suggestions for their company" ON public;
CREATE POLICY "Users can view suggestions for their company"
ON public.ai_suggestions
FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Users can update suggestions for their company" ON public;
CREATE POLICY "Users can update suggestions for their company"
ON public.ai_suggestions
FOR UPDATE
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())))
WITH CHECK (company_id = ANY(public.get_user_company_ids(auth.uid())));

-- ============================================
-- 4. FIX company_invites TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view invites for their companies" ON public.company_invites;
DROP POLICY IF EXISTS "Admins and managers can manage invites" ON public.company_invites;

DROP POLICY IF EXISTS "Users can view invites for their companies" ON public;
CREATE POLICY "Users can view invites for their companies"
ON public.company_invites
FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Admins and managers can manage invites" ON public;
CREATE POLICY "Admins and managers can manage invites"
ON public.company_invites
FOR ALL
TO authenticated
USING (
  company_id = ANY(public.get_user_company_ids(auth.uid()))
  AND (
    public.check_member_role(auth.uid(), company_id, 'admin')
    OR public.check_member_role(auth.uid(), company_id, 'manager')
  )
)
WITH CHECK (
  company_id = ANY(public.get_user_company_ids(auth.uid()))
  AND (
    public.check_member_role(auth.uid(), company_id, 'admin')
    OR public.check_member_role(auth.uid(), company_id, 'manager')
  )
);

-- ============================================
-- 5. FIX lead_insights TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view insights for their company" ON public.lead_insights;

DROP POLICY IF EXISTS "Users can view insights for their company" ON public;
CREATE POLICY "Users can view insights for their company"
ON public.lead_insights
FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

-- ============================================
-- 6. FIX lead_qualification TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view qualifications for their company" ON public.lead_qualification;
DROP POLICY IF EXISTS "Users can update qualifications for their company" ON public.lead_qualification;

DROP POLICY IF EXISTS "Users can view qualifications for their company" ON public;
CREATE POLICY "Users can view qualifications for their company"
ON public.lead_qualification
FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Users can update qualifications for their company" ON public;
CREATE POLICY "Users can update qualifications for their company"
ON public.lead_qualification
FOR UPDATE
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())))
WITH CHECK (company_id = ANY(public.get_user_company_ids(auth.uid())));

-- ============================================
-- 7. FIX member_permissions TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view their own permissions" ON public.member_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.member_permissions;
DROP POLICY IF EXISTS "Admins can insert permissions" ON public.member_permissions;
DROP POLICY IF EXISTS "Admins can update permissions" ON public.member_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions" ON public.member_permissions;

DROP POLICY IF EXISTS "Users can view their own permissions" ON public;
CREATE POLICY "Users can view their own permissions"
ON public.member_permissions
FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.company_members
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can view all permissions" ON public;
CREATE POLICY "Admins can view all permissions"
ON public.member_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm1
    JOIN public.company_members cm2 ON cm1.company_id = cm2.company_id
    WHERE cm1.id = member_id
      AND cm2.user_id = auth.uid()
      AND cm2.role = 'admin'
      AND cm2.is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can insert permissions" ON public;
CREATE POLICY "Admins can insert permissions"
ON public.member_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_members cm1
    JOIN public.company_members cm2 ON cm1.company_id = cm2.company_id
    WHERE cm1.id = member_id
      AND cm2.user_id = auth.uid()
      AND cm2.role = 'admin'
      AND cm2.is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can update permissions" ON public;
CREATE POLICY "Admins can update permissions"
ON public.member_permissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm1
    JOIN public.company_members cm2 ON cm1.company_id = cm2.company_id
    WHERE cm1.id = member_id
      AND cm2.user_id = auth.uid()
      AND cm2.role = 'admin'
      AND cm2.is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can delete permissions" ON public;
CREATE POLICY "Admins can delete permissions"
ON public.member_permissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_members cm1
    JOIN public.company_members cm2 ON cm1.company_id = cm2.company_id
    WHERE cm1.id = member_id
      AND cm2.user_id = auth.uid()
      AND cm2.role = 'admin'
      AND cm2.is_active = true
  )
);

-- ============================================
-- 8. FIX teams TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view teams for their companies" ON public.teams;
DROP POLICY IF EXISTS "Admins and managers can manage teams" ON public.teams;

DROP POLICY IF EXISTS "Users can view teams for their companies" ON public;
CREATE POLICY "Users can view teams for their companies"
ON public.teams
FOR SELECT
TO authenticated
USING (company_id = ANY(public.get_user_company_ids(auth.uid())));

DROP POLICY IF EXISTS "Admins and managers can manage teams" ON public;
CREATE POLICY "Admins and managers can manage teams"
ON public.teams
FOR ALL
TO authenticated
USING (
  company_id = ANY(public.get_user_company_ids(auth.uid()))
  AND (
    public.check_member_role(auth.uid(), company_id, 'admin')
    OR public.check_member_role(auth.uid(), company_id, 'manager')
  )
)
WITH CHECK (
  company_id = ANY(public.get_user_company_ids(auth.uid()))
  AND (
    public.check_member_role(auth.uid(), company_id, 'admin')
    OR public.check_member_role(auth.uid(), company_id, 'manager')
  )
);