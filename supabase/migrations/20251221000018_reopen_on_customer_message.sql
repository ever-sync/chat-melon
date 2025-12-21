-- =====================================================
-- Reabrir conversa automaticamente quando cliente enviar mensagem
-- Conversas fechadas devem voltar quando cliente mandar nova mensagem
-- =====================================================

-- Função para reabrir conversa quando cliente envia mensagem
CREATE OR REPLACE FUNCTION reopen_conversation_on_customer_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_status TEXT;
BEGIN
  -- Só processar mensagens de clientes (is_from_me = false)
  IF NEW.is_from_me = false THEN
    -- Verificar se a conversa existe e está fechada
    SELECT status INTO conv_status
    FROM conversations
    WHERE id = NEW.conversation_id;

    -- Se a conversa está fechada, reabrir
    IF conv_status = 'closed' THEN
      UPDATE conversations
      SET
        status = 'waiting', -- Volta para fila de espera
        resolved_at = NULL,
        resolved_by = NULL,
        tabulation_id = NULL, -- Limpar tabulação anterior
        updated_at = now()
      WHERE id = NEW.conversation_id;

      RAISE NOTICE '🔄 Conversa % reaberta por nova mensagem do cliente', NEW.conversation_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar após INSERT de mensagem
DROP TRIGGER IF EXISTS trigger_reopen_conversation_on_customer_message ON messages;

CREATE TRIGGER trigger_reopen_conversation_on_customer_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION reopen_conversation_on_customer_message();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de reabertura automática criado!';
  RAISE NOTICE '🔄 Conversas fechadas serão reabertas quando cliente enviar mensagem';
  RAISE NOTICE '📥 Status será alterado para "waiting" (fila de espera)';
END $$;
