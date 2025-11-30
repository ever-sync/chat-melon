-- FAXINA GERAL (GARBAGE COLLECTOR)
-- Este script APAGA definitivamente qualquer dado que esteja "perdido" (sem empresa ou sem conversa).

BEGIN;

-- 1. Remover mensagens órfãs (sem conversa ou sem empresa)
DELETE FROM messages 
WHERE conversation_id NOT IN (SELECT id FROM conversations)
   OR company_id NOT IN (SELECT id FROM companies);

-- 2. Remover conversas órfãs (sem empresa)
DELETE FROM conversations 
WHERE company_id NOT IN (SELECT id FROM companies);

-- 3. Remover contatos órfãos (sem empresa)
DELETE FROM contacts 
WHERE company_id NOT IN (SELECT id FROM companies);

-- 4. Remover membros órfãos (sem empresa)
DELETE FROM company_members 
WHERE company_id NOT IN (SELECT id FROM companies);

-- 5. Remover configurações órfãs
DELETE FROM evolution_settings 
WHERE company_id NOT IN (SELECT id FROM companies);

COMMIT;

-- Verificação final
SELECT count(*) as lixo_restante FROM messages 
WHERE company_id NOT IN (SELECT id FROM companies);
