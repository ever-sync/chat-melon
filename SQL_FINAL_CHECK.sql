-- =====================================================
-- DIAGNÓSTICO FINAL: Ver mensagens
-- =====================================================

-- 1. Contar mensagens total
SELECT COUNT(*) as total_mensagens FROM messages;

-- 2. Ver últimas 10 mensagens
SELECT 
  m.id,
  m.content,
  m.is_from_me,
  m.conversation_id,
  m.company_id,
  m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 10;

-- 3. Ver conversas com contagem de mensagens
SELECT 
  c.id as conversation_id,
  co.name as contact_name,
  c.company_id,
  c.status,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as total_messages
FROM conversations c
LEFT JOIN contacts co ON c.contact_id = co.id
ORDER BY c.updated_at DESC
LIMIT 10;
