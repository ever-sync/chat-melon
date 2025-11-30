-- SCRIPT DE RASTREIO DE MENSAGENS RECENTES
-- Vamos encontrar onde as mensagens "oi" estão indo parar

-- 1. Buscar as últimas 10 mensagens criadas no sistema (qualquer empresa/conversa)
SELECT 
    m.id,
    m.content,
    m.created_at,
    m.conversation_id,
    c.contact_number,
    c.contact_name,
    c.company_id,
    comp.name as company_name
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
LEFT JOIN companies comp ON m.company_id = comp.id
ORDER BY m.created_at DESC
LIMIT 10;

-- 2. Verificar se existe alguma conversa para o número do log
SELECT * FROM conversations 
WHERE contact_number LIKE '%5512997548852%';
