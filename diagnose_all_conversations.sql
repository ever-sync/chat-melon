-- DIAGNÓSTICO COMPLETO DE CONVERSAS
-- Vamos listar TODAS as conversas para o número do Raphael para entender a bagunça.

SELECT 
    c.id as conversation_id,
    c.contact_name,
    c.contact_number,
    c.created_at,
    c.last_message,
    c.unread_count,
    COUNT(m.id) as message_count_real,
    c.company_id,
    c.user_id
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.contact_number LIKE '%5512997548852%' -- Número do Raphael
GROUP BY c.id, c.contact_name, c.contact_number, c.created_at, c.last_message, c.unread_count, c.company_id, c.user_id
ORDER BY c.created_at DESC;
