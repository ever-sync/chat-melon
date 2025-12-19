-- Criar conversas para TODAS as empresas baseado nas mensagens existentes
-- Execute este script no Supabase SQL Editor

-- Primeiro, corrigir mensagens com company_id NULL
-- (atribuir à primeira empresa encontrada ou você pode escolher manualmente)
UPDATE messages
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE company_id IS NULL;

-- Agora, criar conversas para cada conversation_id único
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
  'Contato ' || SUBSTRING(m.conversation_id::text, 1, 8) as contact_name,
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
  (
    SELECT COUNT(*)
    FROM messages m4
    WHERE m4.conversation_id = m.conversation_id
      AND NOT m4.is_from_me
      AND COALESCE(m4.status, '') != 'read'
  ) as unread_count,
  'active'::conversation_status as status,
  (
    SELECT MIN(created_at)
    FROM messages m5
    WHERE m5.conversation_id = m.conversation_id
  ) as created_at,
  NOW() as updated_at
FROM messages m
WHERE m.conversation_id IS NOT NULL
  AND m.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = m.conversation_id
  )
GROUP BY m.conversation_id, m.company_id, m.user_id
ON CONFLICT (id) DO NOTHING;

-- Verificar resultados
SELECT
  c.name as company_name,
  COUNT(conv.id) as conversations_created
FROM companies c
LEFT JOIN conversations conv ON conv.company_id = c.id
GROUP BY c.id, c.name
ORDER BY conversations_created DESC;
