-- =====================================================
-- DIAGNÓSTICO: Verificar estado das tabelas
-- Execute este SQL para ver o que está acontecendo
-- =====================================================

-- 1. Verificar se as tabelas existem
SELECT 
  'conversation_quality_scores' as tabela,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_quality_scores') as existe
UNION ALL
SELECT 
  'agent_performance_snapshots',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_performance_snapshots')
UNION ALL
SELECT 
  'ai_suggestions',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_suggestions')
UNION ALL
SELECT 
  'detected_patterns',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'detected_patterns')
UNION ALL
SELECT 
  'coaching_insights',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'coaching_insights')
UNION ALL
SELECT 
  'assistant_settings',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assistant_settings');
