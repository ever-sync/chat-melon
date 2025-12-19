-- ===========================================
-- CORREÇÃO DE VISIBILIDADE DAS MENSAGENS E STATS
-- ===========================================

-- 1. Remover políticas antigas que podem estar bloqueando (se existirem)
DROP POLICY IF EXISTS "Enable read access for company members" ON messages;
DROP POLICY IF EXISTS "Users can view messages of their company" ON messages;

-- 2. Criar política PERMISSIVA para mensagens
-- Permite ver mensagens se o usuário pertencer à mesma empresa (company_id)
CREATE POLICY "Users can view messages of their company"
ON messages FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM company_members 
    WHERE user_id = auth.uid()
  )
);

-- 3. Verificação Rápida de colunas (para evitar erro anterior)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('sender_name', 'contact_name', 'content', 'message_type');

-- 4. Contagem final para confirmar desbloqueio para o seu usuário
-- Deve retornar > 0 se funcionou
SELECT count(*) as minhas_mensagens_visiveis 
FROM messages 
WHERE company_id IN (
    SELECT company_id 
    FROM company_members 
    WHERE user_id = auth.uid()
);
