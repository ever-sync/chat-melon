-- TESTE DE INSERÇÃO MANUAL
-- Vamos tentar inserir uma mensagem "na força" para ver se o banco aceita
-- Substitua 'CONVERSATION_ID' pelo ID de uma conversa real

WITH target_conv AS (
    SELECT id, company_id, user_id FROM conversations LIMIT 1
)
INSERT INTO messages (
    conversation_id,
    company_id,
    user_id,
    content,
    is_from_me,
    status,
    message_type,
    timestamp
)
SELECT 
    id,
    company_id,
    user_id,
    'Mensagem de Teste de Diagnóstico',
    true,
    'sent',
    'text',
    NOW()
FROM target_conv
RETURNING id;
