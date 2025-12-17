-- Migration: 20251217000011_verify_fixes.sql

DO $$
DECLARE
  v_column_type TEXT;
  v_has_trigger BOOLEAN;
  v_has_rpc BOOLEAN;
  v_has_metrics BOOLEAN;
BEGIN
  RAISE NOTICE '🔍 Iniciando Verificação de Fixes...';

  -- 1. Verificar se channel_type agora é um ENUM
  SELECT data_type INTO v_column_type
  FROM information_schema.columns
  WHERE table_name = 'conversations' AND column_name = 'channel_type';

  IF v_column_type = 'USER-DEFINED' THEN
    RAISE NOTICE '✅ [SUCESSO] Conversations.channel_type agora é um ENUM.';
  ELSE
    RAISE NOTICE '❌ [FALHA] Conversations.channel_type ainda é % (esperado: USER-DEFINED/ENUM). Execute a migration 09.', v_column_type;
  END IF;

  -- 2. Verificar Trigger de Sync Chat->CRM
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'conversations' 
    AND trigger_name = 'trigger_sync_conversation_to_contact'
  ) INTO v_has_trigger;

  IF v_has_trigger THEN
    RAISE NOTICE '✅ [SUCESSO] Trigger sync_conversation_to_contact está ativo.';
  ELSE
    RAISE NOTICE '❌ [FALHA] Trigger sync_conversation_to_contact NÃO encontrado. Execute a migration 10.';
  END IF;

  -- 3. Verificar RPC create_deal_from_conversation
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_deal_from_conversation'
  ) INTO v_has_rpc;

  IF v_has_rpc THEN
     RAISE NOTICE '✅ [SUCESSO] Função RPC create_deal_from_conversation existe.';
  ELSE
     RAISE NOTICE '❌ [FALHA] Função RPC create_deal_from_conversation NÃO encontrada.';
  END IF;

  -- 4. Verificar RPC get_contact_metrics
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_contact_metrics'
  ) INTO v_has_metrics;

  IF v_has_metrics THEN
     RAISE NOTICE '✅ [SUCESSO] Função RPC get_contact_metrics existe.';
  ELSE
     RAISE NOTICE '❌ [FALHA] Função RPC get_contact_metrics NÃO encontrada.';
  END IF;

  RAISE NOTICE '🏁 Verificação concluída.';
END $$;
