-- =====================================================
-- DIAGNÓSTICO 2: Verificar colunas das tabelas
-- =====================================================

-- Verificar colunas de conversation_quality_scores
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'conversation_quality_scores'
ORDER BY ordinal_position;
