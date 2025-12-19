-- Verificar todas as conversas criadas

-- 1. Ver todas as conversas por empresa
SELECT
  c.name as company_name,
  c.id as company_id,
  COUNT(conv.id) as total_conversations
FROM companies c
LEFT JOIN conversations conv ON conv.company_id = c.id
GROUP BY c.id, c.name
ORDER BY total_conversations DESC;

-- 2. Ver detalhes das conversas da empresa EverSync
SELECT
  id,
  company_id,
  contact_name,
  last_message,
  created_at
FROM conversations
WHERE company_id = '61215833-73aa-49c6-adcc-790b9d11fd30';

-- 3. Ver mensagens da empresa EverSync
SELECT
  conversation_id,
  company_id,
  content,
  created_at
FROM messages
WHERE company_id = '61215833-73aa-49c6-adcc-790b9d11fd30'
ORDER BY created_at DESC;

-- 4. Verificar se há mensagens com conversation_id mas sem conversa criada
SELECT DISTINCT
  m.conversation_id,
  m.company_id,
  c2.name as company_name,
  COUNT(*) as message_count
FROM messages m
LEFT JOIN conversations conv ON conv.id = m.conversation_id
LEFT JOIN companies c2 ON c2.id = m.company_id
WHERE conv.id IS NULL
GROUP BY m.conversation_id, m.company_id, c2.name
ORDER BY message_count DESC;
