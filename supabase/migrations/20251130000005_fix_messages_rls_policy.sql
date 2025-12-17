-- ============================================
-- FIX: MENSAGENS NÃO APARECEM NO CHAT
-- ============================================
-- Remove política RLS antiga que bloqueia mensagens recebidas do WhatsApp

-- Problema: A política antiga exige auth.uid() = user_id, mas mensagens
-- recebidas do WhatsApp têm user_id = NULL, então são bloqueadas.

-- Solução: Remover política antiga e garantir que apenas a política
-- correta existe (permite ver todas as mensagens das conversas da empresa)

-- 1. Remover política antiga restritiva
DROP POLICY IF EXISTS "Users can view messages in their company" ON messages;

-- 2. Garantir que a política correta existe (idempotente)
DROP POLICY IF EXISTS "Users can view messages in their company conversations" ON messages;

DROP POLICY IF EXISTS "Users can view messages in their company conversations" ON messages;
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

-- 3. Adicionar comentário explicativo
COMMENT ON POLICY "Users can view messages in their company conversations" ON messages IS
  'Permite que usuários vejam todas as mensagens (enviadas e recebidas) em conversas da sua empresa. Não requer user_id match, permitindo visualizar mensagens recebidas do WhatsApp.';

-- 4. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Política RLS de mensagens corrigida!';
  RAISE NOTICE '📨 Usuários agora podem ver mensagens recebidas do WhatsApp';
  RAISE NOTICE '🔒 Segurança mantida: apenas mensagens da empresa do usuário';
END $$;
