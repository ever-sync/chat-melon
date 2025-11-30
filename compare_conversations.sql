-- COMPARAR CONVERSAS DUPLICADAS
-- Vamos ver a diferença entre a conversa que você vê (Vazia) e a que tem mensagens (Cheia)

SELECT 
    id,
    contact_name,
    contact_number,
    unread_count,
    last_message,
    last_message_time,
    created_at,
    updated_at
FROM conversations
WHERE id IN (
    '0291ee3e-47f5-4dc8-95db-341d0eecf7d5', -- A que você está vendo (provavelmente vazia/antiga)
    'e577b17c-68ed-4b8a-8ade-90d24d96e6c2'  -- A que está recebendo as mensagens (nova)
);
