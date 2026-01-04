-- Script para debugar canais do Instagram
-- Execute este script no Supabase SQL Editor

-- 1. Ver todos os canais Instagram
SELECT
    id,
    company_id,
    name,
    external_id,
    status,
    credentials->>'page_id' as page_id,
    credentials->>'instagram_account_id' as instagram_account_id,
    credentials->>'page_access_token' as has_token,
    created_at
FROM channels
WHERE type = 'instagram'
ORDER BY created_at DESC;

-- 2. Ver últimas conversas do Instagram
SELECT
    c.id,
    c.contact_name,
    c.status,
    c.unread_count,
    c.last_message,
    c.last_message_time,
    ch.name as channel_name,
    ch.external_id as channel_external_id
FROM conversations c
JOIN channels ch ON c.channel_id = ch.id
WHERE c.channel_type = 'instagram'
ORDER BY c.last_message_time DESC
LIMIT 10;

-- 3. Ver últimas mensagens do Instagram
SELECT
    m.id,
    m.content,
    m.is_from_me,
    m.timestamp,
    m.external_id,
    conv.contact_name,
    ch.name as channel_name
FROM messages m
JOIN conversations conv ON m.conversation_id = conv.id
JOIN channels ch ON conv.channel_id = ch.id
WHERE m.metadata->>'channel_type' = 'instagram'
ORDER BY m.timestamp DESC
LIMIT 10;
