-- Criar conversas para todas as mensagens que não têm conversa correspondente

INSERT INTO conversations (
  id,
  company_id,
  user_id,
  contact_name,
  contact_number,
  last_message,
  last_message_time,
  unread_count,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT ON (m.conversation_id)
  m.conversation_id as id,
  m.company_id,
  m.user_id,
  'Contato ' || SUBSTRING(m.conversation_id::text, 1, 8) as contact_name,
  'Sem Número' as contact_number,
  (
    SELECT content
    FROM messages m2
    WHERE m2.conversation_id = m.conversation_id
    ORDER BY m2.created_at DESC
    LIMIT 1
  ) as last_message,
  (
    SELECT MAX(created_at)
    FROM messages m3
    WHERE m3.conversation_id = m.conversation_id
  ) as last_message_time,
  (
    SELECT COUNT(*)
    FROM messages m4
    WHERE m4.conversation_id = m.conversation_id
      AND NOT m4.is_from_me
      AND COALESCE(m4.status, '') != 'read'
  ) as unread_count,
  'waiting'::conversation_status as status,
  (
    SELECT MIN(created_at)
    FROM messages m5
    WHERE m5.conversation_id = m.conversation_id
  ) as created_at,
  NOW() as updated_at
FROM messages m
LEFT JOIN conversations c ON c.id = m.conversation_id
WHERE c.id IS NULL
  AND m.conversation_id IS NOT NULL
  AND m.company_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Ver o resultado final: conversas por empresa
SELECT
  c.name as company_name,
  COUNT(conv.id) as total_conversations
FROM companies c
LEFT JOIN conversations conv ON conv.company_id = c.id
GROUP BY c.id, c.name
ORDER BY total_conversations DESC;

-- Ver as conversas criadas para cada empresa
SELECT
  conv.id,
  c.name as company_name,
  conv.contact_name,
  conv.last_message,
  conv.unread_count,
  conv.status
FROM conversations conv
JOIN companies c ON c.id = conv.company_id
ORDER BY c.name, conv.created_at DESC;
