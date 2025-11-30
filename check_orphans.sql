-- VERIFICAÇÃO DE DADOS ÓRFÃOS (LIXO)
-- Vamos verificar se existem registros perdidos que não deveriam estar aí.

-- 1. Conversas sem Empresa
SELECT count(*) as conversas_sem_empresa FROM conversations 
WHERE company_id NOT IN (SELECT id FROM companies);

-- 2. Mensagens sem Conversa
SELECT count(*) as mensagens_sem_conversa FROM messages 
WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- 3. Mensagens sem Empresa
SELECT count(*) as mensagens_sem_empresa FROM messages 
WHERE company_id NOT IN (SELECT id FROM companies);

-- 4. Contatos sem Empresa
SELECT count(*) as contatos_sem_empresa FROM contacts 
WHERE company_id NOT IN (SELECT id FROM companies);

-- 5. Membros sem Empresa
SELECT count(*) as membros_sem_empresa FROM company_members 
WHERE company_id NOT IN (SELECT id FROM companies);
