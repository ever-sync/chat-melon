-- Verificar se a mensagem de teste foi salva

-- 1. Verificar contatos criados recentemente
SELECT
    id,
    name,
    phone_number,
    external_id,
    channel_type,
    created_at
FROM contacts
WHERE channel_type = 'instagram'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar conversas criadas recentemente
SELECT
    c.id,
    c.contact_name,
    c.contact_number,
    c.status,
    c.unread_count,
    c.last_message,
    c.last_message_time,
    ch.name as channel_name,
    c.created_at
FROM conversations c
JOIN channels ch ON c.channel_id = ch.id
WHERE c.channel_type = 'instagram'
ORDER BY c.created_at DESC
LIMIT 5;

-- 3. Verificar mensagens criadas recentemente
SELECT
    m.id,
    m.content,
    m.is_from_me,
    m.message_type,
    m.external_id,
    m.timestamp,
    m.created_at,
    conv.contact_name,
    ch.name as channel_name
FROM messages m
JOIN conversations conv ON m.conversation_id = conv.id
JOIN channels ch ON conv.channel_id = ch.id
WHERE m.metadata->>'channel_type' = 'instagram'
ORDER BY m.created_at DESC
LIMIT 5;
