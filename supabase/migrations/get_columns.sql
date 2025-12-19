-- DESCUBRIR NOME DA COLUNA DE TELEFONE
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'contacts';
