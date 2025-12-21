-- =====================================================
-- Corrigir trigger de reabertura
-- Remover referência a closed_at que não existe
-- =====================================================

-- Recriar função sem campos inexistentes
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

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de reabertura corrigido!';
  RAISE NOTICE '🔄 Removida referência a closed_at';
END $$;
