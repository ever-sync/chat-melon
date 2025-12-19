-- Corrigir conversas com status inválido e popular conversas faltantes

-- Etapa 1: Corrigir status inválidos
DO $$
BEGIN
  -- Verificar se há conversas com status inválido
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE status::text NOT IN ('waiting', 're_entry', 'active', 'chatbot', 'closed')
  ) THEN
    -- Temporariamente, vamos alterar a coluna para text, corrigir, e depois voltar para enum
    ALTER TABLE conversations ALTER COLUMN status TYPE text;

    UPDATE conversations
    SET status = 'closed'
    WHERE status NOT IN ('waiting', 're_entry', 'active', 'chatbot', 'closed');

    -- Voltar para o tipo enum
    ALTER TABLE conversations ALTER COLUMN status TYPE conversation_status USING status::conversation_status;
  END IF;
END $$;

-- Etapa 2: Popular conversas baseado nas mensagens existentes
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
  AND NOT EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = m.conversation_id
  )
GROUP BY m.conversation_id, m.company_id, m.user_id
ON CONFLICT (id) DO NOTHING;
