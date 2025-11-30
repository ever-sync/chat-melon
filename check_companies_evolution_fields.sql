-- VERIFICAR SE A TABELA COMPANIES TEM OS CAMPOS DA EVOLUTION API
-- E se a empresa EverSync tem esses campos preenchidos

-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name LIKE '%evolution%'
ORDER BY ordinal_position;

-- Ver dados da empresa
SELECT 
    id,
    name,
    evolution_instance_name,
    evolution_api_url,
    evolution_api_key
FROM companies
WHERE name = 'EverSync';
