-- ===========================================
-- DIAGNÓSTICO E CORREÇÃO DE DADOS (MENSAGENS)
-- ===========================================

-- 1. Diagnóstico: Ver quantas mensagens estão "órfãs" de empresa
SELECT count(*) as mensagens_sem_company_id FROM messages WHERE company_id IS NULL;

-- 2. Diagnóstico: Ver total de mensagens no banco (geral)
SELECT count(*) as total_mensagens_banco FROM messages;

-- 3. CORREÇÃO MASSIVA
-- Atualiza TODAS as mensagens para ter o company_id da sua conversa pai
-- Isso resolve tanto mensagens orfãs quanto mensagens com ID errado
UPDATE messages m
SET company_id = c.company_id
FROM conversations c
WHERE m.conversation_id = c.id
AND (m.company_id IS NULL OR m.company_id != c.company_id);

-- 4. Verificação Final (Quanto consigo ver agora?)
SELECT count(*) as minhas_mensagens_visiveis_agora 
FROM messages 
WHERE company_id IN (
    SELECT company_id 
    FROM company_members 
    WHERE user_id = auth.uid()
);
