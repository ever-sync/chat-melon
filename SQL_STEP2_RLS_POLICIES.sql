-- =====================================================
-- PASSO 2: HABILITAR RLS E CRIAR POLÍTICAS
-- Execute DEPOIS do Passo 1
-- =====================================================

-- Habilitar RLS
ALTER TABLE conversation_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (para começar)
DROP POLICY IF EXISTS "allow_all_cqs" ON conversation_quality_scores;
CREATE POLICY "allow_all_cqs" ON conversation_quality_scores FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_aps" ON agent_performance_snapshots;
CREATE POLICY "allow_all_aps" ON agent_performance_snapshots FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_ais" ON ai_suggestions;
CREATE POLICY "allow_all_ais" ON ai_suggestions FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_dp" ON detected_patterns;
CREATE POLICY "allow_all_dp" ON detected_patterns FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_ci" ON coaching_insights;
CREATE POLICY "allow_all_ci" ON coaching_insights FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_as" ON assistant_settings;
CREATE POLICY "allow_all_as" ON assistant_settings FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cqs_conv ON conversation_quality_scores(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cqs_agent ON conversation_quality_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_aps_agent ON agent_performance_snapshots(agent_id);
CREATE INDEX IF NOT EXISTS idx_ais_conv ON ai_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ais_agent ON ai_suggestions(agent_id);
CREATE INDEX IF NOT EXISTS idx_dp_company ON detected_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_ci_agent ON coaching_insights(agent_id);
CREATE INDEX IF NOT EXISTS idx_as_user ON assistant_settings(user_id);

SELECT 'RLS e índices configurados!' as resultado;
