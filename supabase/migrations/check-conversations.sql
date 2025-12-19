-- Script para verificar o estado das conversas e mensagens
-- Execute este script no Supabase SQL Editor

-- 1. Verificar total de conversas
SELECT COUNT(*) as total_conversations FROM conversations;

-- 2. Verificar conversas por empresa
SELECT
  c.name as company_name,
  COUNT(conv.id) as conversations_count
FROM companies c
LEFT JOIN conversations conv ON conv.company_id = c.id
GROUP BY c.id, c.name
ORDER BY conversations_count DESC;

-- 3. Verificar total de mensagens
SELECT COUNT(*) as total_messages FROM messages;

-- 4. Verificar mensagens sem conversa correspondente
SELECT COUNT(DISTINCT m.conversation_id) as orphan_conversations
FROM messages m
LEFT JOIN conversations c ON c.id = m.conversation_id
WHERE c.id IS NULL;

-- 5. Ver exemplos de conversas criadas
SELECT
  id,
  company_id,
  contact_name,
  contact_number,
  last_message,
  last_message_time,
  status
FROM conversations
ORDER BY created_at DESC
LIMIT 10;

-- 6. Ver conversation_ids das mensagens que não têm conversa
SELECT DISTINCT
  m.conversation_id,
  m.company_id,
  COUNT(*) as message_count
FROM messages m
LEFT JOIN conversations c ON c.id = m.conversation_id
WHERE c.id IS NULL
GROUP BY m.conversation_id, m.company_id
LIMIT 10;
