-- FIX FINAL DE RLS (OPÇÃO NUCLEAR)
-- Este script remove TODAS as regras de segurança da tabela messages e cria APENAS a correta.

-- 1. Desabilitar RLS temporariamente para limpar a casa
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as policies existentes da tabela messages
DROP POLICY IF EXISTS "Users can view messages in their company" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their company conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their company conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- 3. Recriar a policy CORRETA de visualização (Permissiva)
-- Permite ver mensagens se você tem acesso à conversa (via empresa)
CREATE POLICY "Users can view messages in their company conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  )
);

-- 4. Recriar policy de INSERÇÃO (Necessária para enviar mensagens)
CREATE POLICY "Users can insert messages in their company conversations" ON messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  )
);

-- 5. Recriar policy de UPDATE (Apenas mensagens enviadas por mim)
CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (
  auth.uid() = user_id
);

-- 6. Recriar policy de DELETE (Apenas mensagens enviadas por mim)
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (
  auth.uid() = user_id
);

-- 7. Reabilitar RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 8. Verificação Final (Deve retornar as mensagens agora)
SELECT count(*) as total_mensagens_visiveis 
FROM messages 
WHERE conversation_id = '0291ee3e-47f5-4dc8-95db-341d0eecf7d5';
