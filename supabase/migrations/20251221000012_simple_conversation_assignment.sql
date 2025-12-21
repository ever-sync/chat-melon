-- =====================================================
-- Sistema Simples de Atribuição de Conversas
-- Usa os status existentes do enum conversation_status
-- =====================================================

-- 1. Adicionar campos na tabela conversations
DO $$
BEGIN
  -- Campo: assigned_to (atendente responsável)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'assigned_to'
  ) THEN
    -- Verificar se já existe assigned_to
    -- Se não, adicionar
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'conversations' AND column_name = 'assigned_to'
    ) THEN
      ALTER TABLE conversations ADD COLUMN assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
      CREATE INDEX idx_conversations_assigned_to_new ON conversations(assigned_to);
      COMMENT ON COLUMN conversations.assigned_to IS 'Atendente responsável pela conversa';
    END IF;
  END IF;

  -- Campo: assigned_at (quando foi atribuída)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN assigned_at TIMESTAMPTZ;
    COMMENT ON COLUMN conversations.assigned_at IS 'Data/hora em que foi atribuída';
  END IF;

  -- Campo: resolved_at (quando foi resolvida/fechada)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN resolved_at TIMESTAMPTZ;
    COMMENT ON COLUMN conversations.resolved_at IS 'Data/hora em que foi marcada como fechada';
  END IF;

  -- Campo: resolved_by (quem fechou)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE conversations ADD COLUMN resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    COMMENT ON COLUMN conversations.resolved_by IS 'Usuário que fechou a conversa';
  END IF;
END $$;

-- 2. Função para atribuir conversa
DROP FUNCTION IF EXISTS assign_conversation_to_agent(UUID, UUID);

CREATE OR REPLACE FUNCTION assign_conversation_to_agent(
  p_conversation_id UUID,
  p_assigned_to UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter company_id da conversa
  SELECT company_id INTO v_company_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Conversa não encontrada';
  END IF;

  -- Verificar se o atendente pertence à empresa
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE user_id = p_assigned_to
      AND company_id = v_company_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Atendente não pertence à empresa';
  END IF;

  -- Atribuir conversa
  UPDATE conversations
  SET
    assigned_to = p_assigned_to,
    assigned_at = NOW(),
    status = 'active'::conversation_status
  WHERE id = p_conversation_id;

  RETURN TRUE;
END;
$$;

-- 3. Função para marcar como resolvida (usar 'closed' do enum)
CREATE OR REPLACE FUNCTION mark_conversation_resolved(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_assigned_to UUID;
  v_company_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar conversa
  SELECT assigned_to, company_id INTO v_assigned_to, v_company_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Conversa não encontrada';
  END IF;

  -- Verificar se pertence à empresa
  IF NOT EXISTS (
    SELECT 1 FROM company_members
    WHERE user_id = v_user_id
      AND company_id = v_company_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Você não tem permissão';
  END IF;

  -- Marcar como fechada
  UPDATE conversations
  SET
    status = 'closed'::conversation_status,
    resolved_at = NOW(),
    resolved_by = v_user_id
  WHERE id = p_conversation_id;

  RETURN TRUE;
END;
$$;

-- 4. Função para reabrir conversa
CREATE OR REPLACE FUNCTION reopen_closed_conversation(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar conversa
  SELECT company_id INTO v_company_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Conversa não encontrada';
  END IF;

  -- Verificar se é admin
  SELECT role IN ('owner', 'admin', 'manager') INTO v_is_admin
  FROM company_members
  WHERE user_id = v_user_id
    AND company_id = v_company_id
    AND is_active = true;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem reabrir conversas';
  END IF;

  -- Reabrir conversa
  UPDATE conversations
  SET
    status = CASE
      WHEN assigned_to IS NOT NULL THEN 'active'::conversation_status
      ELSE 'waiting'::conversation_status
    END,
    resolved_at = NULL,
    resolved_by = NULL
  WHERE id = p_conversation_id;

  RETURN TRUE;
END;
$$;

-- 5. Atualizar política RLS para visibilidade baseada em atribuição
DROP POLICY IF EXISTS "Users can view conversations in their company" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations based on assignment" ON conversations;

CREATE POLICY "Conversations visibility based on role and assignment"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = conversations.company_id
        AND cm.is_active = true
        AND (
          -- Admin/Manager/Owner/Supervisor vê todas (exceto fechadas)
          (cm.role IN ('owner', 'admin', 'manager', 'supervisor') AND conversations.status != 'closed'::conversation_status)
          OR
          -- Seller/Viewer vê apenas as atribuídas a ele ou não atribuídas (exceto fechadas)
          (cm.role IN ('seller', 'viewer') AND (
            conversations.assigned_to = auth.uid()
            OR conversations.assigned_to IS NULL
          ) AND conversations.status != 'closed'::conversation_status)
        )
    )
  );

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_company_status_new ON conversations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_status_new ON conversations(assigned_to, status);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de atribuição criado!';
  RAISE NOTICE 'Funções:';
  RAISE NOTICE '  - assign_conversation_to_agent(conversation_id, user_id)';
  RAISE NOTICE '  - mark_conversation_resolved(conversation_id)';
  RAISE NOTICE '  - reopen_closed_conversation(conversation_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Status usados:';
  RAISE NOTICE '  - waiting: não atribuída';
  RAISE NOTICE '  - active: atribuída e ativa';
  RAISE NOTICE '  - closed: resolvida (oculta)';
END $$;
