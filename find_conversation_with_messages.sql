-- LIMPAR CONVERSAS DUPLICADAS DO RAPHAEL
-- Vamos ver qual conversa tem mensagens e deletar as vazias

SELECT 
    c.id,
    c.contact_name,
    c.contact_number,
    c.created_at,
    c.last_message,
    COUNT(m.id) as total_mensagens
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.id IN (
    '4ceef8f4-4a65-42ae-b233-056407459aee',
    'fed4e3a5-65a7-4647-ae28-91116ecef136',
    '9df4d484-a8a4-404e-b305-070d63bd77b6'
)
GROUP BY c.id, c.contact_name, c.contact_number, c.created_at, c.last_message
ORDER BY c.created_at DESC;
