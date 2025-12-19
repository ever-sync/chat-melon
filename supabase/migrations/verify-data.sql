-- Verificar dados no banco de dados

-- 1. Listar todas as empresas
SELECT id, name, created_at FROM companies ORDER BY created_at DESC;

-- 2. Contar mensagens por empresa
SELECT
  company_id,
  COUNT(*) as total_messages
FROM messages
GROUP BY company_id
ORDER BY total_messages DESC;

-- 3. Verificar se há mensagens sem company_id
SELECT COUNT(*) as messages_without_company
FROM messages
WHERE company_id IS NULL;

-- 4. Ver exemplos de mensagens (primeiras 10)
SELECT
  id,
  conversation_id,
  company_id,
  content,
  created_at
FROM messages
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar conversas existentes
SELECT
  company_id,
  COUNT(*) as total_conversations
FROM conversations
GROUP BY company_id;

-- 6. Ver conversation_ids únicos nas mensagens
SELECT DISTINCT
  conversation_id,
  company_id,
  COUNT(*) as message_count
FROM messages
WHERE conversation_id IS NOT NULL
GROUP BY conversation_id, company_id
ORDER BY message_count DESC
LIMIT 20;
