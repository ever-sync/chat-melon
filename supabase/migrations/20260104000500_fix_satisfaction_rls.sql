-- Fix RLS for satisfaction_settings
DROP POLICY IF EXISTS "Admins can manage satisfaction settings" ON satisfaction_settings;
DROP POLICY IF EXISTS "Users can view satisfaction settings in their company" ON satisfaction_settings;

CREATE POLICY "Admins can manage satisfaction settings"
  ON satisfaction_settings FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
      AND is_active = true
    )
  );

CREATE POLICY "Users can view satisfaction settings in their company"
  ON satisfaction_settings FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Fix RLS for satisfaction_surveys
DROP POLICY IF EXISTS "Users can view surveys in their company" ON satisfaction_surveys;
DROP POLICY IF EXISTS "System can insert surveys" ON satisfaction_surveys;
DROP POLICY IF EXISTS "System can update surveys" ON satisfaction_surveys;

CREATE POLICY "Users can view surveys in their company"
  ON satisfaction_surveys FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Members can insert surveys"
  ON satisfaction_surveys FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Members can update surveys"
  ON satisfaction_surveys FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );
