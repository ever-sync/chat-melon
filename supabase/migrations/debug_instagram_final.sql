-- Debug final - Instagram não aparecendo no chat

-- 1. Comparar Instagram vs outros canais
SELECT
    channel_type,
    COUNT(*) as total,
    COUNT(CASE WHEN last_message_time IS NULL THEN 1 END) as sem_last_message_time
FROM conversations
WHERE status != 'closed'
GROUP BY channel_type
ORDER BY total DESC;

-- 2. Ver últimas conversas Instagram com TODOS os detalhes importantes
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
    c.channel_id
FROM conversations c
WHERE c.channel_type = 'instagram'
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. Ver company_ids únicos e quantas conversas cada um tem
SELECT
    company_id,
    COUNT(*) as total_conversas,
    COUNT(CASE WHEN channel_type = 'instagram' THEN 1 END) as instagram_conversas,
    COUNT(CASE WHEN channel_type != 'instagram' THEN 1 END) as outras_conversas
FROM conversations
GROUP BY company_id
ORDER BY total_conversas DESC;

-- 4. Verificar se há conversas com last_message_time NULL
SELECT
    channel_type,
    COUNT(*) as total,
    COUNT(last_message_time) as com_timestamp,
    COUNT(*) - COUNT(last_message_time) as sem_timestamp
FROM conversations
WHERE status != 'closed'
GROUP BY channel_type;
