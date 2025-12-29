-- Fix RLS policy for assistant_settings UPDATE
-- The UPDATE policy needs both USING and WITH CHECK clauses

DROP POLICY IF EXISTS "Users can update their own settings" ON assistant_settings;

CREATE POLICY "Users can update their own settings"
  ON assistant_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also add a helpful comment
COMMENT ON POLICY "Users can update their own settings" ON assistant_settings
  IS 'Allows users to update only their own assistant settings';
