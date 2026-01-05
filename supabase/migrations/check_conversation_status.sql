-- Verificar o status das conversas do Instagram

SELECT
    c.id,
    c.contact_name,
    c.status,
    c.channel_type,
    c.unread_count,
    c.last_message,
    c.last_message_time,
    c.created_at,
    ch.name as channel_name
FROM conversations c
LEFT JOIN channels ch ON c.channel_id = ch.id
WHERE c.channel_type = 'instagram'
ORDER BY c.created_at DESC
LIMIT 10;
