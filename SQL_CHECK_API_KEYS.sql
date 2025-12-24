-- =====================================================
-- VERIFICAR: Chaves de API configuradas
-- =====================================================

-- Ver colunas da tabela companies (para saber onde estão as chaves)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name LIKE '%api%' OR column_name LIKE '%key%';

-- Ver configuração da empresa atual
SELECT 
  id,
  name,
  groq_api_key IS NOT NULL as tem_groq,
  openai_api_key IS NOT NULL as tem_openai,
  gemini_api_key IS NOT NULL as tem_gemini
FROM companies
LIMIT 5;
