-- DIAGNOSTICO DE MENSAGENS
-- Substitua 'ID_DA_CONVERSA' pelo ID de uma conversa que você sabe que tem mensagens
-- Vou usar um ID genérico aqui, mas você pode pegar um id da lista de conversas
-- ex: SELECT id FROM conversations LIMIT 1;

WITH target_conv AS (
    SELECT id FROM conversations LIMIT 1
)
SELECT 
    m.id,
    m.content,
    m.message_type,
    m.created_at,
    m.sender_name,
    m.from_me
FROM messages m, target_conv tc
WHERE m.conversation_id = tc.id
LIMIT 5;

-- Verificar TOTAL de mensagens vs mensagens visíveis para o usuário atual
SELECT 
    (SELECT COUNT(*) FROM messages) as total_absoluto_mensagens,
    (SELECT COUNT(*) FROM messages WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())) as total_msg_visiveis_rls_company;
