-- ============================================
-- FASE 8: SISTEMA DE AUTOMAÇÕES/PLAYBOOKS
-- ============================================

-- Tabela de Playbooks (Automações)
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'stage_change', 'time_inactive', 'keyword', 'deal_created')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Execuções de Playbooks
CREATE TABLE IF NOT EXISTS playbook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  current_step INTEGER DEFAULT 0,
  steps_log JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_playbooks_company ON playbooks(company_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_trigger_type ON playbooks(trigger_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_playbook_executions_playbook ON playbook_executions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_deal ON playbook_executions(deal_id);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_status ON playbook_executions(status);

-- RLS Policies para playbooks
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view playbooks in their company" ON playbooks;
CREATE POLICY "Users can view playbooks in their company"
  ON playbooks FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage playbooks" ON playbooks;
CREATE POLICY "Admins can manage playbooks"
  ON playbooks FOR ALL
  USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- RLS Policies para playbook_executions
ALTER TABLE playbook_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view executions in their company" ON playbook_executions;
CREATE POLICY "Users can view executions in their company"
  ON playbook_executions FOR SELECT
  USING (playbook_id IN (
    SELECT id FROM playbooks WHERE company_id = get_user_company(auth.uid())
  ));

DROP POLICY IF EXISTS "System can insert executions" ON playbook_executions;
CREATE POLICY "System can insert executions"
  ON playbook_executions FOR INSERT
  WITH CHECK (playbook_id IN (
    SELECT id FROM playbooks WHERE company_id = get_user_company(auth.uid())
  ));

DROP POLICY IF EXISTS "System can update executions" ON playbook_executions;
CREATE POLICY "System can update executions"
  ON playbook_executions FOR UPDATE
  USING (playbook_id IN (
    SELECT id FROM playbooks WHERE company_id = get_user_company(auth.uid())
  ));

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_playbooks_updated_at ON playbooks;
CREATE TRIGGER update_playbooks_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para executar playbook quando deal muda de stage
CREATE OR REPLACE FUNCTION trigger_playbooks_on_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_playbook RECORD;
BEGIN
  -- Buscar playbooks ativos com trigger de mudança de stage
  FOR v_playbook IN
    SELECT * FROM playbooks
    WHERE company_id = NEW.company_id
      AND is_active = true
      AND trigger_type = 'stage_change'
      AND (
        trigger_config->>'target_stage_id' IS NULL 
        OR trigger_config->>'target_stage_id' = NEW.stage_id::text
      )
  LOOP
    -- Criar execução do playbook
    INSERT INTO playbook_executions (
      playbook_id,
      deal_id,
      status
    ) VALUES (
      v_playbook.id,
      NEW.id,
      'running'
    );
    
    -- Incrementar contador de uso
    UPDATE playbooks
    SET usage_count = usage_count + 1
    WHERE id = v_playbook.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger no deals para executar playbooks
DROP TRIGGER IF EXISTS trigger_playbooks_stage_change ON deals;
CREATE TRIGGER trigger_playbooks_stage_change
  AFTER UPDATE OF stage_id ON deals
  FOR EACH ROW
  WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
  EXECUTE FUNCTION trigger_playbooks_on_stage_change();

-- Comentários
COMMENT ON TABLE playbooks IS 'Automações configuráveis com gatilhos e ações';
COMMENT ON TABLE playbook_executions IS 'Histórico de execuções de playbooks';
COMMENT ON COLUMN playbooks.trigger_type IS 'Tipo de gatilho: manual, stage_change, time_inactive, keyword, deal_created';
COMMENT ON COLUMN playbooks.trigger_config IS 'Configuração do gatilho (ex: stage_id alvo, tempo de inatividade, keywords)';
COMMENT ON COLUMN playbooks.steps IS 'Array de steps com type e config de cada ação';
COMMENT ON COLUMN playbook_executions.steps_log IS 'Log detalhado da execução de cada step';