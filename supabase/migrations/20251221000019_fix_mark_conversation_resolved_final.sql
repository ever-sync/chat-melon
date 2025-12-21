-- =====================================================
-- Corrigir função mark_conversation_resolved FINAL
-- Remover referência a closed_at que não existe
-- =====================================================

-- Dropar função existente primeiro
DROP FUNCTION IF EXISTS mark_conversation_resolved(UUID, UUID);

-- Recriar função sem campos inexistentes
CREATE FUNCTION mark_conversation_resolved(
  p_conversation_id UUID,
  p_tabulation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data JSONB;
BEGIN
  -- Atualizar conversa para fechada com tabulação
  UPDATE conversations
  SET
    status = 'closed',
    resolved_at = now(),
    resolved_by = auth.uid(),
    tabulation_id = p_tabulation_id,
    updated_at = now()
  WHERE id = p_conversation_id;

  -- Retornar dados atualizados como JSONB
  SELECT jsonb_build_object(
    'id', c.id,
    'status', c.status,
    'resolved_at', c.resolved_at,
    'resolved_by', c.resolved_by,
    'tabulation_id', c.tabulation_id
  ) INTO result_data
  FROM conversations c
  WHERE c.id = p_conversation_id;

  RETURN result_data;
END;
$$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Função mark_conversation_resolved corrigida (versão final)!';
  RAISE NOTICE '📝 Removida referência a campos inexistentes';
  RAISE NOTICE '🔄 Retorna JSONB em vez de TABLE';
END $$;
