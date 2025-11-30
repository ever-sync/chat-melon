-- SCRIPT DE DIAGNÓSTICO DE MENSAGENS
-- Execute este script no SQL Editor do Supabase para entender por que as mensagens não aparecem

-- 1. Verificar Políticas RLS Ativas na tabela messages
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- 2. Verificar se existem mensagens para a conversa específica (como ADMIN, ignorando RLS)
-- Substitua o ID abaixo pelo ID da conversa que você está testando
SELECT 
    count(*) as total_messages_in_db,
    count(*) filter (where user_id is null) as incoming_messages,
    count(*) filter (where user_id is not null) as outgoing_messages
FROM messages 
WHERE conversation_id = '0291ee3e-47f5-4dc8-95db-341d0eecf7d5'; -- ID da conversa do log

-- 3. Verificar dados da conversa e empresa
SELECT 
    c.id as conversation_id, 
    c.contact_name, 
    c.company_id,
    comp.name as company_name
FROM conversations c
LEFT JOIN companies comp ON c.company_id = comp.id
WHERE c.id = '0291ee3e-47f5-4dc8-95db-341d0eecf7d5';

-- 4. Verificar se o SEU usuário está na empresa correta
-- Substitua pelo seu ID de usuário (pegue do log: 1b115bca-8738-4cf8-9995-41892c9815d9)
SELECT 
    user_id, 
    company_id, 
    role 
FROM company_members 
WHERE user_id = '1b115bca-8738-4cf8-9995-41892c9815d9';
