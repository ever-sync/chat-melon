-- Verificar as políticas RLS da tabela conversations

-- 1. Ver se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'conversations';

-- 2. Ver todas as políticas RLS
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
WHERE tablename = 'conversations';

-- 3. Testar a query que o frontend usa (simulando o usuário autenticado)
-- Substitua o user_id pelo seu
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "1b115bca-8738-4cf8-9995-41892c9815d9"}';

SELECT
    id,
    company_id,
    contact_name,
    last_message,
    unread_count
FROM conversations
WHERE company_id = '61215833-73aa-49c6-adcc-790b9d11fd30'
ORDER BY last_message_time DESC;

RESET role;
