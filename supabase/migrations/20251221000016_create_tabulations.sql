-- =====================================================
-- Criar sistema de Tabulação (categorização de atendimentos)
-- =====================================================

-- 1. Criar tabela de tabulações
CREATE TABLE IF NOT EXISTS tabulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280', -- cor para identificação visual
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT tabulations_name_company_unique UNIQUE (company_id, name)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_tabulations_company_id ON tabulations(company_id);
CREATE INDEX IF NOT EXISTS idx_tabulations_is_active ON tabulations(is_active);

-- 3. Adicionar campo tabulation_id na tabela conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS tabulation_id UUID REFERENCES tabulations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_tabulation_id ON conversations(tabulation_id);

-- 4. Habilitar RLS
ALTER TABLE tabulations ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para tabulations
-- SELECT: Usuários podem ver tabulações da sua empresa
CREATE POLICY "Users can view tabulations in their company"
  ON tabulations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = tabulations.company_id
        AND is_active = true
    )
  );

-- INSERT: Admins podem criar tabulações
CREATE POLICY "Admins can create tabulations"
  ON tabulations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = tabulations.company_id
        AND is_active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- UPDATE: Admins podem atualizar tabulações
CREATE POLICY "Admins can update tabulations"
  ON tabulations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = tabulations.company_id
        AND is_active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- DELETE: Admins podem deletar tabulações
CREATE POLICY "Admins can delete tabulations"
  ON tabulations FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = tabulations.company_id
        AND is_active = true
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- 6. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tabulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tabulations_updated_at_trigger
  BEFORE UPDATE ON tabulations
  FOR EACH ROW
  EXECUTE FUNCTION update_tabulations_updated_at();

-- 7. Atualizar função mark_conversation_resolved para aceitar tabulation_id
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
  UPDATE conversations
  SET
    status = 'closed',
    resolved_at = now(),
    resolved_by = auth.uid(),
    tabulation_id = p_tabulation_id,
    updated_at = now()
  WHERE conversations.id = p_conversation_id;

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

-- 8. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Tabulação criado com sucesso!';
  RAISE NOTICE '📊 Tabela tabulations criada';
  RAISE NOTICE '🔗 Campo tabulation_id adicionado em conversations';
  RAISE NOTICE '🔒 Políticas RLS configuradas';
  RAISE NOTICE '⚡ Função mark_conversation_resolved atualizada';
END $$;
