-- =====================================================
-- RLS POLICIES FALTANTES PARA AI_METRICS_DAILY
-- =====================================================

CREATE POLICY "Users can view AI metrics in their company"
  ON ai_metrics_daily FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert AI metrics"
  ON ai_metrics_daily FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update AI metrics"
  ON ai_metrics_daily FOR UPDATE
  USING (true);