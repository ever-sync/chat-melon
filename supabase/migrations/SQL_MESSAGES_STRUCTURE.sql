-- =====================================================
-- DIAGNÓSTICO: Ver estrutura da tabela messages
-- =====================================================

-- 1. Ver todas as colunas da tabela messages
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;
