-- =====================================================
-- Corrigir função mark_conversation_resolved
-- Aceitar tabulation_id NULL e ocultar conversa
-- =====================================================

-- Recriar função para lidar corretamente com NULL
CREATE OR REPLACE FUNCTION mark_conversation_resolved(
  p_conversation_id UUID,
  p_tabulation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  tabulation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar conversa para fechada com tabulação
  UPDATE conversations
  SET
    status = 'closed',
    resolved_at = now(),
    resolved_by = auth.uid(),
    tabulation_id = p_tabulation_id,
    updated_at = now()
  WHERE conversations.id = p_conversation_id;

  -- Retornar dados atualizados
  RETURN QUERY
  SELECT
    c.id,
    c.status::TEXT,
    c.resolved_at,
    c.resolved_by,
    c.tabulation_id
  FROM conversations c
  WHERE c.id = p_conversation_id;
END;
$$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Função mark_conversation_resolved corrigida!';
  RAISE NOTICE '📝 Agora aceita tabulation_id NULL sem erros';
END $$;
