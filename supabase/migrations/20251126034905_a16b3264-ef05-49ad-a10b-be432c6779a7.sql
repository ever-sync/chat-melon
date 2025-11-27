-- ============================================
-- RLS POLICIES FOR RBAC TABLES
-- ============================================

-- Role Permissions Policies
-- All authenticated users can view role permissions (needed to check their own permissions)
CREATE POLICY "Users can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert role permissions
CREATE POLICY "Admins can insert role permissions"
ON public.role_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Only admins can update role permissions
CREATE POLICY "Admins can update role permissions"
ON public.role_permissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Only admins can delete role permissions
CREATE POLICY "Admins can delete role permissions"
ON public.role_permissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Member Permissions Policies
-- Users can view their own custom permissions
CREATE POLICY "Users can view their own member permissions"
ON public.member_permissions
FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT id FROM public.company_members
    WHERE user_id = auth.uid()
  )
);

-- Admins can view all member permissions in their company
CREATE POLICY "Admins can view all member permissions"
ON public.member_permissions
FOR SELECT
TO authenticated
USING (
  member_id IN (
    SELECT cm.id 
    FROM public.company_members cm
    WHERE cm.company_id IN (
      SELECT company_id 
      FROM public.company_members 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = cm.company_id
        AND ur.role = 'admin'
    )
  )
);

-- Only admins can insert member permissions
CREATE POLICY "Admins can insert member permissions"
ON public.member_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  member_id IN (
    SELECT cm.id 
    FROM public.company_members cm
    WHERE cm.company_id IN (
      SELECT company_id 
      FROM public.company_members 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = cm.company_id
        AND ur.role = 'admin'
    )
  )
);

-- Only admins can update member permissions
CREATE POLICY "Admins can update member permissions"
ON public.member_permissions
FOR UPDATE
TO authenticated
USING (
  member_id IN (
    SELECT cm.id 
    FROM public.company_members cm
    WHERE cm.company_id IN (
      SELECT company_id 
      FROM public.company_members 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = cm.company_id
        AND ur.role = 'admin'
    )
  )
);

-- Only admins can delete member permissions
CREATE POLICY "Admins can delete member permissions"
ON public.member_permissions
FOR DELETE
TO authenticated
USING (
  member_id IN (
    SELECT cm.id 
    FROM public.company_members cm
    WHERE cm.company_id IN (
      SELECT company_id 
      FROM public.company_members 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = cm.company_id
        AND ur.role = 'admin'
    )
  )
);