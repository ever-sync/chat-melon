-- ANÁLISE COMPLETA DAS 3 CONVERSAS DO RAPHAEL
-- Vamos ver qual tem mais mensagens e qual é a mais recente

SELECT 
    c.id,
    c.contact_name,
    c.contact_number,
    c.created_at,
    c.last_message,
    c.last_message_time,
    COUNT(m.id) as total_mensagens,
    MAX(m.created_at) as mensagem_mais_recente
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.contact_name = 'Raphael' 
  AND c.company_id = 'd865cc81-0272-4691-bc54-44304a77ad4e'
GROUP BY c.id, c.contact_name, c.contact_number, c.created_at, c.last_message, c.last_message_time
ORDER BY mensagem_mais_recente DESC NULLS LAST;
