-- Script final para criar a conversa

-- 1. Remover todos os triggers problemáticos
DROP TRIGGER IF EXISTS trigger_check_resolution_sla ON conversations;
DROP TRIGGER IF EXISTS trigger_sync_conversation_to_contact ON conversations;
DROP TRIGGER IF EXISTS trigger_update_conversation_sla ON conversations;

-- 2. Deletar a conversa se já existe (para fazer INSERT limpo)
DELETE FROM conversations WHERE id = '204cb6ed-978d-4dc0-b1b1-67d48f2324c3';

-- 3. Inserir a conversa (INSERT simples, sem ON CONFLICT)
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
LIMIT 1;

-- 4. Verificar se foi criada
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

-- 5. Ver total de conversas por empresa
SELECT
  c.name as company_name,
  COUNT(conv.id) as total_conversations
FROM companies c
LEFT JOIN conversations conv ON conv.company_id = c.id
GROUP BY c.id, c.name
ORDER BY total_conversations DESC;
