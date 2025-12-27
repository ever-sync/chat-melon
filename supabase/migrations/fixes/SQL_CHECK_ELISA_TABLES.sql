-- Verificar estrutura das tabelas usadas pela Elisa
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name IN ('lead_insights', 'lead_qualification', 'ai_suggestions')
ORDER BY table_name, ordinal_position;
