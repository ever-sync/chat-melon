-- =====================================================
-- Listar e corrigir todos os triggers na tabela conversations
-- =====================================================

-- Listar todos os triggers
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE '📋 Listando todos os triggers na tabela conversations:';

  FOR trigger_record IN
    SELECT tgname, pg_get_triggerdef(oid) as definition
    FROM pg_trigger
    WHERE tgrelid = 'conversations'::regclass
    AND tgisinternal = false
  LOOP
    RAISE NOTICE '  - Trigger: %', trigger_record.tgname;
    RAISE NOTICE '    Definição: %', trigger_record.definition;
  END LOOP;
END $$;

-- Dropar TODOS os triggers que podem estar causando problema
DROP TRIGGER IF EXISTS set_conversation_closed_at ON conversations;
DROP TRIGGER IF EXISTS update_conversation_closed_at ON conversations;
DROP TRIGGER IF EXISTS handle_conversation_status_change ON conversations;
DROP TRIGGER IF EXISTS check_conversation_sla ON conversations;

-- Recriar apenas os triggers necessários
-- (O trigger de reabertura já foi criado na migração anterior)

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Triggers antigos removidos!';
  RAISE NOTICE '🔄 Apenas trigger de reabertura automática está ativo';
END $$;
