-- DIAGNÓSTICO DE ID DA CONVERSA
-- Vamos verificar se as mensagens estão sendo salvas em um ID de conversa DIFERENTE do que estamos olhando.

-- 1. Buscar as últimas mensagens do número Raphael (5512997548852)
SELECT 
    m.id as message_id,
    m.content,
    m.conversation_id as msg_conv_id,
    c.id as real_conv_id,
    c.contact_name,
    m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.contact_number LIKE '%5512997548852%'
ORDER BY m.created_at DESC
LIMIT 5;

-- 2. Comparar com o ID que estamos testando
SELECT 'ID que estamos testando' as info, '0291ee3e-47f5-4dc8-95db-341d0eecf7d5' as id;
