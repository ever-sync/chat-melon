-- =====================================================
-- VALIDAÇÃO TEMPORÁRIA - Mostra status das correções
-- =====================================================

DO $$
DECLARE
  v_sender_id_exists BOOLEAN;
  v_auto_assign_exists BOOLEAN;
  v_user_id_exists BOOLEAN;
  v_company_members_exists BOOLEAN;
  v_external_id_exists BOOLEAN;
  v_error_count INTEGER;
  v_success_count INTEGER;
BEGIN
  -- Verificar cada correção
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sender_id'
  ) INTO v_sender_id_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queues' AND column_name = 'auto_assign'
  ) INTO v_auto_assign_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) INTO v_user_id_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_members'
  ) INTO v_company_members_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'external_id'
  ) INTO v_external_id_exists;

  -- Contar sucessos e falhas
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO v_success_count, v_error_count
  FROM error_fix_log;

  -- Exibir relatório
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '         RELATÓRIO DE VALIDAÇÃO - 17/12/2025        ';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMO GERAL:';
  RAISE NOTICE '   Total de correções aplicadas: %', v_success_count;
  RAISE NOTICE '   Total de correções com falha: %', v_error_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ CORREÇÕES BEM-SUCEDIDAS:';
  RAISE NOTICE '   [%] messages.sender_id', CASE WHEN v_sender_id_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   [%] queues.auto_assign', CASE WHEN v_auto_assign_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   [%] queue_members.user_id', CASE WHEN v_user_id_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   [%] company_members table', CASE WHEN v_company_members_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   [%] contacts.external_id', CASE WHEN v_external_id_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '';

  -- Mostrar detalhes de falhas (simplificado)
  IF v_error_count > 0 THEN
    RAISE NOTICE '❌ TOTAL DE ERROS: %', v_error_count;
    RAISE NOTICE '   Consulte a tabela error_fix_log para detalhes';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '📈 FUNCIONALIDADES RESTAURADAS:';
  IF v_sender_id_exists THEN
    RAISE NOTICE '   ✅ Métricas de tempo de resposta';
  ELSE
    RAISE NOTICE '   ❌ Métricas de tempo de resposta (sender_id faltando)';
  END IF;

  IF v_auto_assign_exists THEN
    RAISE NOTICE '   ✅ Auto-assignment de conversas';
  ELSE
    RAISE NOTICE '   ❌ Auto-assignment de conversas (auto_assign faltando)';
  END IF;

  IF v_user_id_exists THEN
    RAISE NOTICE '   ✅ Distribuição de filas (Round Robin, Load Balancing)';
  ELSE
    RAISE NOTICE '   ❌ Distribuição de filas (user_id faltando)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  IF v_error_count > 0 THEN
    RAISE NOTICE '   1. Corrigir erro de conversão channel_type';
    RAISE NOTICE '   2. Testar funcionalidades restauradas';
    RAISE NOTICE '   3. Remover .env do Git';
  ELSE
    RAISE NOTICE '   1. ✅ Todas correções aplicadas!';
    RAISE NOTICE '   2. Testar funcionalidades';
    RAISE NOTICE '   3. Remover .env do Git';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
END $$;
