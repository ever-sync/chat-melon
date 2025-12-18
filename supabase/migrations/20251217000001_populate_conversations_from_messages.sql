-- Migration para popular a tabela conversations baseado nas mensagens existentes
-- Isso vai criar conversas para mensagens que não têm conversation_id válido

-- Primeiro, vamos criar conversas únicas baseadas no user_id e conversation_id das mensagens
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
SELECT DISTINCT
  m.conversation_id as id,
  m.company_id,
  m.user_id,
  COALESCE('Contato ' || SUBSTRING(m.conversation_id::text, 1, 8), 'Sem Nome') as contact_name,
  'Sem Número' as contact_number,
  (
    SELECT content
    FROM messages m2
    WHERE m2.conversation_id = m.conversation_id
    ORDER BY m2.timestamp DESC
    LIMIT 1
  ) as last_message,
  (
    SELECT MAX(timestamp)
    FROM messages m3
    WHERE m3.conversation_id = m.conversation_id
  ) as last_message_time,
  0 as unread_count,
  'active' as status,
  (
    SELECT MIN(created_at)
    FROM messages m4
    WHERE m4.conversation_id = m.conversation_id
  ) as created_at,
  NOW() as updated_at
FROM messages m
WHERE m.conversation_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = m.conversation_id
  )
GROUP BY m.conversation_id, m.company_id, m.user_id
ON CONFLICT (id) DO NOTHING;

-- Atualizar o contador de mensagens não lidas
UPDATE conversations c
SET unread_count = (
  SELECT COUNT(*)
  FROM messages m
  WHERE m.conversation_id = c.id
    AND NOT m.is_from_me
    AND m.status != 'read'
)
WHERE EXISTS (
  SELECT 1
  FROM messages m
  WHERE m.conversation_id = c.id
);
