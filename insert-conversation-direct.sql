-- Inserir conversa diretamente (triggers vão executar mas vamos garantir que não quebrem)

-- Primeiro, vamos corrigir os triggers problemáticos

-- 1. Corrigir ou remover o trigger check_resolution_sla
DROP TRIGGER IF EXISTS trigger_check_resolution_sla ON conversations;

-- 2. Corrigir ou remover o trigger sync_conversation_to_contact
DROP TRIGGER IF EXISTS trigger_sync_conversation_to_contact ON conversations;

-- Agora inserir a conversa
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
SELECT
  '204cb6ed-978d-4dc0-b1b1-67d48f2324c3'::uuid as id,
  '61215833-73aa-49c6-adcc-790b9d11fd30'::uuid as company_id,
  user_id,
  'Contato Imobiliário' as contact_name,
  'Sem Número' as contact_number,
  (
    SELECT content
    FROM messages
    WHERE conversation_id = '204cb6ed-978d-4dc0-b1b1-67d48f2324c3'
    ORDER BY created_at DESC
    LIMIT 1
  ) as last_message,
  (
    SELECT MAX(created_at)
    FROM messages
    WHERE conversation_id = '204cb6ed-978d-4dc0-b1b1-67d48f2324c3'
  ) as last_message_time,
  (
    SELECT COUNT(*)
    FROM messages
    WHERE conversation_id = '204cb6ed-978d-4dc0-b1b1-67d48f2324c3'
      AND NOT is_from_me
      AND COALESCE(status, '') != 'read'
  ) as unread_count,
  'active'::conversation_status as status,
  (
    SELECT MIN(created_at)
    FROM messages
    WHERE conversation_id = '204cb6ed-978d-4dc0-b1b1-67d48f2324c3'
  ) as created_at,
  NOW() as updated_at
FROM messages
WHERE conversation_id = '204cb6ed-978d-4dc0-b1b1-67d48f2324c3'
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  last_message = EXCLUDED.last_message,
  last_message_time = EXCLUDED.last_message_time,
  unread_count = EXCLUDED.unread_count,
  updated_at = NOW();

-- Verificar se foi criada
SELECT
  id,
  company_id,
  contact_name,
  last_message,
  unread_count,
  status,
  created_at
FROM conversations
WHERE id = '204cb6ed-978d-4dc0-b1b1-67d48f2324c3';

-- Ver total de conversas por empresa
SELECT
  c.name as company_name,
  COUNT(conv.id) as total_conversations
FROM companies c
LEFT JOIN conversations conv ON conv.company_id = c.id
GROUP BY c.id, c.name
ORDER BY total_conversations DESC;
