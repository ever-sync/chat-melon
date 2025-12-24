-- Ver todas as colunas da tabela companies
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'companies'
ORDER BY ordinal_position;
