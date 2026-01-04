-- Testar a query exata que o frontend usa

-- 1. Query básica (sem filtros) - Mesma do Chat.tsx
SELECT
    c.*,
    cont.profile_pic_url
FROM conversations c
LEFT JOIN contacts cont ON c.contact_id = cont.id
WHERE c.company_id = '61215833-73aa-49c6-adcc-790b9d11fd30'  -- Substitua pelo seu company_id
  AND c.status != 'closed'
ORDER BY c.last_message_time DESC NULLS LAST
LIMIT 20;

-- 2. Verificar se last_message_time está NULL nas conversas Instagram
SELECT
    id,
    contact_name,
    channel_type,
    status,
    last_message,
    last_message_time,
    created_at
FROM conversations
WHERE channel_type = 'instagram'
ORDER BY created_at DESC;

-- 3. Comparar com conversas WhatsApp para ver a diferença
SELECT
    channel_type,
    COUNT(*) as total,
    COUNT(last_message_time) as com_last_message_time,
    COUNT(*) - COUNT(last_message_time) as sem_last_message_time
FROM conversations
WHERE status != 'closed'
GROUP BY channel_type;

-- 4. Ver as 10 últimas conversas de TODOS os canais
SELECT
    id,
    contact_name,
    channel_type,
    status,
    last_message,
    last_message_time,
    created_at
FROM conversations
WHERE status != 'closed'
ORDER BY
    CASE
        WHEN last_message_time IS NULL THEN created_at
        ELSE last_message_time
    END DESC
LIMIT 20;
