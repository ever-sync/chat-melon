-- =====================================================
-- ASSISTENTE DE IA PARA MONITORAMENTO DE ATENDENTES
-- Migration: 20251223000010_ai_assistant_tables.sql
-- =====================================================

-- Métricas de qualidade por conversa
CREATE TABLE IF NOT EXISTS conversation_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Scores (0-100)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  empathy_score INTEGER CHECK (empathy_score >= 0 AND empathy_score <= 100),
  resolution_score INTEGER CHECK (resolution_score >= 0 AND resolution_score <= 100),
  tone_score INTEGER CHECK (tone_score >= 0 AND tone_score <= 100),
  professionalism_score INTEGER CHECK (professionalism_score >= 0 AND professionalism_score <= 100),
  response_quality_score INTEGER CHECK (response_quality_score >= 0 AND response_quality_score <= 100),

  -- Análises
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  detected_issues JSONB DEFAULT '[]'::jsonb,
  positive_highlights JSONB DEFAULT '[]'::jsonb,
  improvement_areas JSONB DEFAULT '[]'::jsonb,

  -- Métricas
  avg_response_time INTEGER, -- segundos
  message_count INTEGER DEFAULT 0,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 100),

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance do agente em tempo real
CREATE TABLE IF NOT EXISTS agent_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Métricas do momento
  active_conversations INTEGER DEFAULT 0,
  waiting_conversations INTEGER DEFAULT 0,
  avg_response_time INTEGER, -- segundos (últimos 30min)
  conversations_handled_today INTEGER DEFAULT 0,
  quality_score_today DECIMAL(5,2),

  -- Status
  is_online BOOLEAN DEFAULT false,
  current_load VARCHAR(20) CHECK (current_load IN ('low', 'medium', 'high', 'overloaded')),

  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sugestões geradas pela IA
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Sugestão
  type VARCHAR(20) CHECK (type IN ('response', 'action', 'alert', 'tip')),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT,
  suggested_response TEXT,
  reasoning TEXT,

  -- Contexto
  trigger_context JSONB DEFAULT '{}'::jsonb,

  -- Feedback
  was_useful BOOLEAN,
  was_used BOOLEAN,
  agent_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Padrões detectados
CREATE TABLE IF NOT EXISTS detected_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Padrão
  pattern_type VARCHAR(30) CHECK (pattern_type IN ('recurring_issue', 'success_pattern', 'bottleneck', 'performance_trend')),
  pattern_name TEXT NOT NULL,
  description TEXT,

  -- Dados
  occurrences INTEGER DEFAULT 1,
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high')),

  -- Recomendações
  recommended_actions JSONB DEFAULT '[]'::jsonb,

  -- Período
  detected_from TIMESTAMPTZ,
  detected_to TIMESTAMPTZ,

  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insights de coaching
CREATE TABLE IF NOT EXISTS coaching_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Insight
  category VARCHAR(20) CHECK (category IN ('strength', 'improvement_area', 'achievement', 'concern')),
  title TEXT NOT NULL,
  description TEXT,

  -- Evidências
  evidence JSONB DEFAULT '{}'::jsonb,

  -- Ação recomendada
  recommended_action TEXT,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),

  -- Acompanhamento
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved')),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do assistente por usuário
CREATE TABLE IF NOT EXISTS assistant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Preferências
  is_enabled BOOLEAN DEFAULT true,
  position VARCHAR(20) DEFAULT 'bottom-left' CHECK (position IN ('bottom-left', 'bottom-right')),
  notification_level VARCHAR(20) DEFAULT 'all' CHECK (notification_level IN ('all', 'important', 'critical', 'none')),

  -- Tipos de alertas habilitados
  alert_slow_response BOOLEAN DEFAULT true,
  alert_quality_issues BOOLEAN DEFAULT true,
  alert_customer_frustration BOOLEAN DEFAULT true,
  alert_forgotten_conversations BOOLEAN DEFAULT true,

  -- Limites personalizados
  slow_response_threshold INTEGER DEFAULT 300, -- segundos
  quality_threshold INTEGER DEFAULT 70, -- score mínimo

  -- Sugestões
  show_response_suggestions BOOLEAN DEFAULT true,
  show_action_suggestions BOOLEAN DEFAULT true,
  show_coaching_tips BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_quality_scores_conversation ON conversation_quality_scores(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_agent ON conversation_quality_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_company ON conversation_quality_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_date ON conversation_quality_scores(analyzed_at);

CREATE INDEX IF NOT EXISTS idx_performance_snapshots_agent ON agent_performance_snapshots(agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_company ON agent_performance_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_time ON agent_performance_snapshots(snapshot_at);

CREATE INDEX IF NOT EXISTS idx_suggestions_conversation ON ai_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_agent ON ai_suggestions(agent_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_company ON ai_suggestions(company_id);
-- Criar índice condicional apenas se coluna was_used existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'ai_suggestions' AND column_name = 'was_used') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_suggestions_active ON ai_suggestions(expires_at) WHERE was_used IS NULL';
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar erros
END $$;
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON ai_suggestions(priority, created_at);

CREATE INDEX IF NOT EXISTS idx_patterns_company ON detected_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_patterns_agent ON detected_patterns(agent_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON detected_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_coaching_agent ON coaching_insights(agent_id);
CREATE INDEX IF NOT EXISTS idx_coaching_company ON coaching_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_coaching_status ON coaching_insights(status);
CREATE INDEX IF NOT EXISTS idx_coaching_category ON coaching_insights(category);

CREATE INDEX IF NOT EXISTS idx_assistant_settings_user ON assistant_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_settings_company ON assistant_settings(company_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE conversation_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para conversation_quality_scores
CREATE POLICY "Users can view quality scores from their company"
  ON conversation_quality_scores FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can insert quality scores"
  ON conversation_quality_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update quality scores"
  ON conversation_quality_scores FOR UPDATE
  USING (true);

-- Políticas para agent_performance_snapshots
CREATE POLICY "Users can view performance snapshots from their company"
  ON agent_performance_snapshots FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can insert performance snapshots"
  ON agent_performance_snapshots FOR INSERT
  WITH CHECK (true);

-- Políticas para ai_suggestions
CREATE POLICY "Users can view their own suggestions"
  ON ai_suggestions FOR SELECT
  USING (
    agent_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Service role can insert suggestions"
  ON ai_suggestions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own suggestions feedback"
  ON ai_suggestions FOR UPDATE
  USING (agent_id = auth.uid());

-- Políticas para detected_patterns
CREATE POLICY "Managers can view patterns from their company"
  ON detected_patterns FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
  ) OR agent_id = auth.uid());

CREATE POLICY "Service role can manage patterns"
  ON detected_patterns FOR ALL
  USING (true);

-- Políticas para coaching_insights
CREATE POLICY "Users can view their own coaching insights"
  ON coaching_insights FOR SELECT
  USING (
    agent_id = auth.uid() OR
    manager_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Managers can update coaching insights"
  ON coaching_insights FOR UPDATE
  USING (
    manager_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Service role can manage coaching insights"
  ON coaching_insights FOR INSERT
  WITH CHECK (true);

-- Políticas para assistant_settings
CREATE POLICY "Users can view their own settings"
  ON assistant_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON assistant_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON assistant_settings FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular score médio de qualidade de um agente hoje
CREATE OR REPLACE FUNCTION get_agent_quality_score_today(p_agent_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(overall_score), 0)
    FROM conversation_quality_scores
    WHERE agent_id = p_agent_id
    AND analyzed_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar conversas ativas de um agente
CREATE OR REPLACE FUNCTION get_agent_active_conversations(p_agent_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM conversations
    WHERE assigned_to = p_agent_id
    AND status IN ('open', 'pending')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar conversas aguardando resposta
CREATE OR REPLACE FUNCTION get_agent_waiting_conversations(p_agent_id UUID, p_threshold_minutes INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM conversations c
    WHERE c.assigned_to = p_agent_id
    AND c.status IN ('open', 'pending')
    AND EXISTS (
      SELECT 1 FROM messages m
      WHERE m.conversation_id = c.id
      AND m.sender_type = 'contact'
      AND m.created_at > (
        SELECT COALESCE(MAX(m2.created_at), '1970-01-01'::timestamptz)
        FROM messages m2
        WHERE m2.conversation_id = c.id
        AND m2.sender_type = 'agent'
      )
      AND m.created_at < NOW() - (p_threshold_minutes || ' minutes')::interval
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tempo médio de resposta do agente (últimos 30 min)
CREATE OR REPLACE FUNCTION get_agent_avg_response_time(p_agent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_avg_time INTEGER;
BEGIN
  -- Simplificado: retorna a média dos últimos snapshots
  SELECT COALESCE(AVG(avg_response_time), 0)::INTEGER
  INTO v_avg_time
  FROM agent_performance_snapshots
  WHERE agent_id = p_agent_id
  AND snapshot_at >= NOW() - INTERVAL '30 minutes';

  RETURN v_avg_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at em assistant_settings
CREATE OR REPLACE FUNCTION update_assistant_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assistant_settings_updated_at
  BEFORE UPDATE ON assistant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_settings_updated_at();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE conversation_quality_scores IS 'Armazena scores de qualidade para cada conversa analisada pela IA';
COMMENT ON TABLE agent_performance_snapshots IS 'Snapshots periódicos de performance dos agentes';
COMMENT ON TABLE ai_suggestions IS 'Sugestões geradas pela IA para os agentes';
COMMENT ON TABLE detected_patterns IS 'Padrões detectados pela análise de IA';
COMMENT ON TABLE coaching_insights IS 'Insights de coaching gerados para melhoria dos agentes';
COMMENT ON TABLE assistant_settings IS 'Configurações personalizadas do assistente por usuário';
