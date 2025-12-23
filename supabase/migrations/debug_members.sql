-- Script para verificar e corrigir problemas com company_members e company_invites

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('company_members', 'company_invites', 'teams');

-- 2. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('company_members', 'company_invites')
ORDER BY tablename, policyname;

-- 3. Verificar se você tem um registro em company_members
-- Substitua 'SEU_USER_ID' pelo seu user_id real
SELECT 
  cm.*,
  c.name as company_name
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
WHERE cm.user_id = auth.uid();

-- 4. Se não tiver registro, vamos criar um para o usuário atual
-- IMPORTANTE: Execute isso apenas se a query acima não retornar resultados

-- Primeiro, vamos verificar se você tem uma empresa
SELECT id, name FROM companies WHERE owner_id = auth.uid();

-- Se você tem uma empresa mas não tem registro em company_members, execute:
-- (Descomente as linhas abaixo e substitua os valores)

/*
INSERT INTO company_members (
  company_id,
  user_id,
  role,
  display_name,
  email,
  is_active
)
SELECT 
  c.id,
  auth.uid(),
  'owner'::user_role,
  u.raw_user_meta_data->>'full_name',
  u.email,
  true
FROM companies c
CROSS JOIN auth.users u
WHERE c.owner_id = auth.uid()
  AND u.id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = c.id AND user_id = auth.uid()
  );
*/

-- 5. Verificar convites existentes
SELECT * FROM company_invites 
WHERE company_id IN (
  SELECT company_id FROM company_members WHERE user_id = auth.uid()
)
ORDER BY created_at DESC;
