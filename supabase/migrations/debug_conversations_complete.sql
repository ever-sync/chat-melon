-- Debug completo das conversas do Instagram

-- 1. Ver todas as conversas Instagram com todos os campos
SELECT
    c.id,
    c.company_id,
    c.user_id,
    c.channel_id,
    c.channel_type,
    c.contact_id,
    c.contact_name,
    c.contact_number,
    c.status,
    c.unread_count,
    c.last_message,
    c.last_message_time,
    c.external_conversation_id,
    c.created_at,
    c.updated_at,
    ch.name as channel_name,
    ch.external_id as channel_external_id,
    cont.name as contact_real_name,
    cont.phone_number as contact_phone
FROM conversations c
LEFT JOIN channels ch ON c.channel_id = ch.id
LEFT JOIN contacts cont ON c.contact_id = cont.id
WHERE c.channel_type = 'instagram'
ORDER BY c.created_at DESC
LIMIT 10;

-- 2. Ver se há algum problema com o user_id
SELECT
    c.id,
    c.contact_name,
    c.user_id,
    c.status,
    p.email as user_email,
    p.name as user_name
FROM conversations c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE c.channel_type = 'instagram'
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. Contar conversas por status
SELECT
    status,
    COUNT(*) as count
FROM conversations
WHERE channel_type = 'instagram'
GROUP BY status;

-- 4. Ver mensagens relacionadas
SELECT
    m.id,
    m.conversation_id,
    m.content,
    m.is_from_me,
    m.timestamp,
    c.contact_name,
    c.status as conversation_status
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.channel_type = 'instagram'
ORDER BY m.timestamp DESC
LIMIT 10;
