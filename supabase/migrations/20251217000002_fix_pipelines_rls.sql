-- ============================================
-- FIX: Pipelines RLS Policies for INSERT/UPDATE
-- ============================================
-- This migration fixes the 403 error when creating/updating pipelines
-- by adding explicit INSERT and UPDATE policies for admins

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage pipelines" ON pipelines;

-- Create separate policies for better control
DROP POLICY IF EXISTS "Admins can insert pipelines" ON pipelines;
CREATE POLICY "Admins can insert pipelines" ON pipelines
  FOR INSERT 
  WITH CHECK (
    company_id = get_user_company(auth.uid()) AND
    has_role(auth.uid(), company_id, 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins can update pipelines" ON pipelines;
CREATE POLICY "Admins can update pipelines" ON pipelines
  FOR UPDATE
  USING (
    company_id = get_user_company(auth.uid()) AND
    has_role(auth.uid(), company_id, 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins can delete pipelines" ON pipelines;
CREATE POLICY "Admins can delete pipelines" ON pipelines
  FOR DELETE
  USING (
    company_id = get_user_company(auth.uid()) AND
    has_role(auth.uid(), company_id, 'admin'::app_role)
  );

-- Also fix pipeline_stages policies
DROP POLICY IF EXISTS "Admins can manage stages" ON pipeline_stages;

DROP POLICY IF EXISTS "Admins can insert stages" ON pipeline_stages;
CREATE POLICY "Admins can insert stages" ON pipeline_stages
  FOR INSERT
  WITH CHECK (
    pipeline_id IN (
      SELECT id FROM pipelines 
      WHERE company_id = get_user_company(auth.uid()) 
      AND has_role(auth.uid(), company_id, 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Admins can update stages" ON pipeline_stages;
CREATE POLICY "Admins can update stages" ON pipeline_stages
  FOR UPDATE
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines 
      WHERE company_id = get_user_company(auth.uid()) 
      AND has_role(auth.uid(), company_id, 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS "Admins can delete stages" ON pipeline_stages;
CREATE POLICY "Admins can delete stages" ON pipeline_stages
  FOR DELETE
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines 
      WHERE company_id = get_user_company(auth.uid()) 
      AND has_role(auth.uid(), company_id, 'admin'::app_role)
    )
  );

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Pipeline RLS policies fixed successfully!';
END $$;
