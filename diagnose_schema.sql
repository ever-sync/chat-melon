-- DIAGNÓSTICO DE SCHEMA E RLS
-- Vamos verificar se há uma quebra na cadeia de permissões (tabelas renomeadas ou funções quebradas)

-- 1. Verificar quais tabelas de "membros" existem
SELECT tablename 
FROM pg_tables 
WHERE tablename IN ('company_users', 'company_members');

-- 2. Ver o conteúdo da função get_user_company (usada nas policies antigas)
SELECT pg_get_functiondef('public.get_user_company'::regproc);

-- 3. Ver as policies da tabela CONVERSATIONS (se o usuário não vê a conversa, não vê a mensagem)
SELECT policyname, qual, cmd 
FROM pg_policies 
WHERE tablename = 'conversations';

-- 4. Ver as policies da tabela COMPANY_MEMBERS
SELECT policyname, qual, cmd 
FROM pg_policies 
WHERE tablename = 'company_members';

-- 5. Teste prático: O usuário consegue ver a conversa?
-- (Substitua o ID da conversa se necessário, mas vamos usar o da screenshot anterior)
SELECT count(*) as conversations_visible 
FROM conversations 
WHERE id = '0291ee3e-47f5-4dc8-95db-341d0eecf7d5';
