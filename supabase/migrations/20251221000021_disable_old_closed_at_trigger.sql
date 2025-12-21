-- =====================================================
-- Desabilitar triggers antigos que usam closed_at
-- O campo closed_at não existe na tabela conversations
-- =====================================================

-- Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS handle_conversation_sla ON conversations;
DROP FUNCTION IF EXISTS handle_conversation_sla();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Triggers antigos com closed_at removidos!';
  RAISE NOTICE '🔧 Sistema de SLA precisa ser recriado sem closed_at';
END $$;
