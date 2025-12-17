-- =====================================================
-- RLS POLICIES FALTANTES PARA AI_METRICS_DAILY
-- =====================================================

DROP POLICY IF EXISTS "Users can view AI metrics in their company" ON ai_metrics_daily;
CREATE POLICY "Users can view AI metrics in their company"
  ON ai_metrics_daily FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "System can insert AI metrics" ON ai_metrics_daily;
CREATE POLICY "System can insert AI metrics"
  ON ai_metrics_daily FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update AI metrics" ON ai_metrics_daily;
CREATE POLICY "System can update AI metrics"
  ON ai_metrics_daily FOR UPDATE
  USING (true);