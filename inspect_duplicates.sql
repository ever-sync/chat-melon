-- INVESTIGAÇÃO DAS 3 CONVERSAS DUPLICADAS
-- Vamos ver quem são essas 3 conversas e quantas mensagens cada uma tem.

SELECT 
    c.id as conversation_id,
    c.contact_name,
    c.contact_number,
    c.created_at,
    c.last_message,
    c.unread_count,
    c.company_id,
    COUNT(m.id) as total_mensagens
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.id IN (
    '6e3ed1d8-e083-4908-9ffb-794d0d7d4515',
    '73bbe3cc-f428-4b96-bcbf-8d6a8301ee5c',
    'b468a298-897b-4380-ae37-0befbc73cd0a'
)
GROUP BY c.id, c.contact_name, c.contact_number, c.created_at, c.last_message, c.unread_count, c.company_id;
