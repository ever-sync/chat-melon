-- =====================================================
-- FIX: Garantir que mensagens sejam visíveis
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1. Verificar se o usuário atual é membro de alguma empresa
SELECT 
  cm.company_id,
  c.name as company_name,
  cm.role,
  p.email as user_email
FROM company_members cm
JOIN companies c ON cm.company_id = c.id
JOIN profiles p ON cm.user_id = p.id
LIMIT 10;

-- 2. Contar mensagens por empresa
SELECT 
  company_id,
  COUNT(*) as total_messages
FROM messages
GROUP BY company_id;

-- 3. Ver últimas 5 mensagens (sem RLS - como admin)
SELECT 
  m.id,
  m.content,
  m.sender_type,
  m.conversation_id,
  m.company_id,
  m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 5;
