-- Debug simples das conversas do Instagram

-- 1. Comparar Instagram vs outros canais
SELECT
    channel_type,
    COUNT(*) as total,
    COUNT(CASE WHEN last_message_time IS NULL THEN 1 END) as sem_last_message_time,
    MIN(company_id) as company_id_exemplo
FROM conversations
WHERE status != 'closed'
GROUP BY channel_type;

-- 2. Ver últimas conversas Instagram com detalhes
SELECT
    c.id,
    c.company_id,
    c.contact_name,
    c.status,
    c.last_message,
    c.last_message_time,
    c.created_at,
    c.unread_count,
    c.user_id,
    ch.name as channel_name
FROM conversations c
LEFT JOIN channels ch ON c.channel_id = ch.id
WHERE c.channel_type = 'instagram'
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. Ver todos os company_ids distintos
SELECT DISTINCT company_id, COUNT(*) as conversas
FROM conversations
GROUP BY company_id
ORDER BY conversas DESC;

-- 4. Contar conversas Instagram por status
SELECT
    status,
    COUNT(*) as total
FROM conversations
WHERE channel_type = 'instagram'
GROUP BY status;

-- 5. Ver mensagens Instagram recentes
SELECT
    m.id,
    m.content,
    m.is_from_me,
    m.timestamp,
    m.created_at,
    c.contact_name,
    c.status
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.channel_type = 'instagram'
ORDER BY m.created_at DESC
LIMIT 10;

-- 6. Verificar se há conversas Instagram com last_message_time NULL
SELECT
    id,
    contact_name,
    last_message,
    last_message_time,
    created_at
FROM conversations
WHERE channel_type = 'instagram'
  AND last_message_time IS NULL;
