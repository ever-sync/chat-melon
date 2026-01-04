-- Fix RLS for scoring_rules
DROP POLICY IF EXISTS "Admins can manage scoring rules" ON scoring_rules;
DROP POLICY IF EXISTS "Users can view scoring rules in their company" ON scoring_rules;

-- Policy for viewing rules (everyone in the company)
CREATE POLICY "Users can view scoring rules in their company"
  ON scoring_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = scoring_rules.company_id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

-- Policy for managing rules (owners, admins, managers)
CREATE POLICY "Admins can manage scoring rules"
  ON scoring_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = scoring_rules.company_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = scoring_rules.company_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
      AND is_active = true
    )
  );
