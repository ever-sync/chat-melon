-- CHECAGEM SUPREMA
-- Vamos ver TUDO sem filtros

-- 1. Total absoluto de mensagens na tabela inteira
SELECT count(*) as TOTAL_GERAL_MESSAGES FROM messages;

-- 2. Listar as primeiras 5 mensagens (se existirem)
SELECT id, content, conversation_id, company_id FROM messages LIMIT 5;

-- 3. Ver se existe ALGUMA mensagem para alguma das conversas que você vê
-- Pega IDs das conversas visíveis primeiro
WITH my_convs AS (
    SELECT id FROM conversations LIMIT 10
)
SELECT m.id, m.content 
FROM messages m
INNER JOIN my_convs c ON m.conversation_id = c.id;
