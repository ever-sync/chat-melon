-- Script para verificar políticas RLS da tabela companies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'companies' 
ORDER BY policyname;
