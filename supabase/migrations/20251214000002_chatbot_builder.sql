-- =====================================================
-- FASE 2: Chatbot Builder Visual
-- =====================================================

-- Tabela principal de chatbots
CREATE TABLE IF NOT EXISTS chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Fluxo (formato ReactFlow)
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',

  -- Variáveis globais do bot
  variables JSONB DEFAULT '{}',

  -- Configurações gerais
  settings JSONB DEFAULT '{
    "typing_delay_ms": 1000,
    "default_fallback_message": "Desculpe, não entendi. Poderia reformular?",
    "max_retries": 3,
    "session_timeout_minutes": 30
  }',

  -- Triggers que ativam o bot
  triggers JSONB DEFAULT '[]',
  -- Exemplo: [
  --   {"type": "keyword", "value": "oi", "channel": "whatsapp"},
  --   {"type": "first_message", "channel": "*"},
  --   {"type": "menu_option", "value": "1"}
  -- ]

  -- Canais onde o bot está ativo
  active_channels TEXT[] DEFAULT ARRAY['whatsapp'],

  -- Status
  status VARCHAR(20) DEFAULT 'draft',
  -- draft, active, paused, archived

  -- Versionamento
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),

  -- Métricas
  total_executions INTEGER DEFAULT 0,
  successful_completions INTEGER DEFAULT 0,
  handoffs_count INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versões históricas dos chatbots
CREATE TABLE IF NOT EXISTS chatbot_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  variables JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  triggers JSONB DEFAULT '[]',

  -- Quem publicou
  published_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notas da versão
  release_notes TEXT,

  UNIQUE(chatbot_id, version)
);

-- Execuções do chatbot
CREATE TABLE IF NOT EXISTS chatbot_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  chatbot_version INTEGER NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Estado atual
  current_node_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'running',
  -- running, waiting_input, completed, handoff, failed, timeout

  -- Variáveis da sessão
  session_variables JSONB DEFAULT '{}',

  -- Histórico de execução
  execution_log JSONB DEFAULT '[]',
  -- Exemplo: [
  --   {"node_id": "start_1", "type": "start", "timestamp": "...", "duration_ms": 10},
  --   {"node_id": "msg_1", "type": "message", "content": "Olá!", "timestamp": "..."},
  --   {"node_id": "question_1", "type": "question", "question": "Qual seu nome?", "answer": "João", "timestamp": "..."}
  -- ]

  -- Tracking de interações
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  handoff_at TIMESTAMPTZ,
  handoff_reason TEXT,

  -- Contexto adicional
  trigger_type VARCHAR(50), -- keyword, first_message, menu, manual
  trigger_value TEXT,
  channel_type VARCHAR(20)
);

-- Índices para chatbots
CREATE INDEX IF NOT EXISTS idx_chatbots_company ON chatbots(company_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_status ON chatbots(company_id, status);
CREATE INDEX IF NOT EXISTS idx_chatbot_executions_chatbot ON chatbot_executions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_executions_conversation ON chatbot_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_executions_status ON chatbot_executions(status) WHERE status IN ('running', 'waiting_input');
CREATE INDEX IF NOT EXISTS idx_chatbot_executions_timeout ON chatbot_executions(last_interaction_at) WHERE status = 'waiting_input';

-- Função genérica para updated_at (criar se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_chatbots_updated_at ON chatbots;
CREATE TRIGGER trigger_chatbots_updated_at
  BEFORE UPDATE ON chatbots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Chatbot Templates (pré-configurados)
-- =====================================================

CREATE TABLE IF NOT EXISTS chatbot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- atendimento, vendas, suporte, agendamento

  -- Template do fluxo
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  variables JSONB DEFAULT '{}',

  -- Preview image
  preview_image_url TEXT,

  -- Uso
  usage_count INTEGER DEFAULT 0,

  -- Se é template do sistema ou criado pela empresa
  is_system BOOLEAN DEFAULT false,
  company_id UUID REFERENCES companies(id), -- null para templates do sistema

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_templates ENABLE ROW LEVEL SECURITY;

-- Chatbots
CREATE POLICY "Users can manage chatbots from their company"
  ON chatbots FOR ALL
  USING (company_id = get_user_company());

-- Chatbot Versions
CREATE POLICY "Users can view chatbot versions from their company"
  ON chatbot_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_versions.chatbot_id
      AND c.company_id = get_user_company()
    )
  );

-- Chatbot Executions
CREATE POLICY "Users can view executions from their company"
  ON chatbot_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_executions.chatbot_id
      AND c.company_id = get_user_company()
    )
  );

-- Templates
CREATE POLICY "Users can view system templates and their own"
  ON chatbot_templates FOR SELECT
  USING (is_system = true OR company_id = get_user_company());

CREATE POLICY "Users can manage their own templates"
  ON chatbot_templates FOR ALL
  USING (company_id = get_user_company())
  WITH CHECK (company_id = get_user_company());

-- =====================================================
-- Helper Functions
-- =====================================================

-- Função para obter chatbot ativo para um canal/trigger
CREATE OR REPLACE FUNCTION get_active_chatbot(
  p_company_id UUID,
  p_channel_type VARCHAR(20),
  p_trigger_type VARCHAR(50),
  p_trigger_value TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_chatbot_id UUID;
BEGIN
  SELECT id INTO v_chatbot_id
  FROM chatbots
  WHERE company_id = p_company_id
    AND status = 'active'
    AND (p_channel_type = ANY(active_channels) OR '*' = ANY(active_channels))
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(triggers) t
      WHERE t->>'type' = p_trigger_type
        AND (
          p_trigger_value IS NULL
          OR t->>'value' = p_trigger_value
          OR t->>'value' = '*'
        )
    )
  ORDER BY created_at
  LIMIT 1;

  RETURN v_chatbot_id;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar estatísticas do chatbot
CREATE OR REPLACE FUNCTION increment_chatbot_stats(
  p_chatbot_id UUID,
  p_stat VARCHAR(50),
  p_amount INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  CASE p_stat
    WHEN 'executions' THEN
      UPDATE chatbots SET total_executions = total_executions + p_amount WHERE id = p_chatbot_id;
    WHEN 'completions' THEN
      UPDATE chatbots SET successful_completions = successful_completions + p_amount WHERE id = p_chatbot_id;
    WHEN 'handoffs' THEN
      UPDATE chatbots SET handoffs_count = handoffs_count + p_amount WHERE id = p_chatbot_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Insert System Templates
-- =====================================================

INSERT INTO chatbot_templates (name, description, category, nodes, edges, is_system, preview_image_url) VALUES
(
  'Atendimento Básico',
  'Fluxo simples de boas-vindas e coleta de informações',
  'atendimento',
  '[
    {"id": "start_1", "type": "start", "position": {"x": 250, "y": 0}, "data": {"label": "Início"}},
    {"id": "msg_welcome", "type": "message", "position": {"x": 250, "y": 100}, "data": {"content": "Olá! 👋 Bem-vindo(a)! Como posso ajudar você hoje?"}},
    {"id": "menu_1", "type": "menu", "position": {"x": 250, "y": 200}, "data": {"title": "Escolha uma opção:", "options": [{"id": "1", "label": "Falar com atendente", "value": "atendente"}, {"id": "2", "label": "Dúvidas frequentes", "value": "faq"}, {"id": "3", "label": "Horário de funcionamento", "value": "horario"}]}},
    {"id": "handoff_1", "type": "handoff", "position": {"x": 100, "y": 350}, "data": {"message": "Transferindo para um atendente. Aguarde um momento!"}},
    {"id": "msg_faq", "type": "message", "position": {"x": 250, "y": 350}, "data": {"content": "Acesse nossas dúvidas frequentes em: example.com/faq"}},
    {"id": "msg_horario", "type": "message", "position": {"x": 400, "y": 350}, "data": {"content": "Nosso horário de funcionamento é de Segunda a Sexta, das 9h às 18h."}}
  ]',
  '[
    {"id": "e1", "source": "start_1", "target": "msg_welcome"},
    {"id": "e2", "source": "msg_welcome", "target": "menu_1"},
    {"id": "e3", "source": "menu_1", "target": "handoff_1", "sourceHandle": "atendente"},
    {"id": "e4", "source": "menu_1", "target": "msg_faq", "sourceHandle": "faq"},
    {"id": "e5", "source": "menu_1", "target": "msg_horario", "sourceHandle": "horario"}
  ]',
  true,
  NULL
),
(
  'Qualificação de Lead',
  'Coleta informações para qualificar potenciais clientes',
  'vendas',
  '[
    {"id": "start_1", "type": "start", "position": {"x": 250, "y": 0}, "data": {"label": "Início"}},
    {"id": "msg_welcome", "type": "message", "position": {"x": 250, "y": 100}, "data": {"content": "Olá! Obrigado pelo interesse em nossos produtos! Vou fazer algumas perguntas rápidas para direcioná-lo melhor. 😊"}},
    {"id": "q_name", "type": "question", "position": {"x": 250, "y": 200}, "data": {"question": "Qual é o seu nome?", "variableName": "nome", "validation": "text"}},
    {"id": "q_email", "type": "question", "position": {"x": 250, "y": 300}, "data": {"question": "E seu email para contato?", "variableName": "email", "validation": "email"}},
    {"id": "q_interesse", "type": "menu", "position": {"x": 250, "y": 400}, "data": {"title": "Qual seu principal interesse?", "options": [{"id": "1", "label": "Produto A", "value": "produto_a"}, {"id": "2", "label": "Produto B", "value": "produto_b"}, {"id": "3", "label": "Apenas conhecer", "value": "conhecer"}]}},
    {"id": "msg_thanks", "type": "message", "position": {"x": 250, "y": 500}, "data": {"content": "Perfeito, {{nome}}! Um consultor entrará em contato pelo email {{email}} em breve!"}},
    {"id": "handoff_1", "type": "handoff", "position": {"x": 250, "y": 600}, "data": {"message": "Lead qualificado! Interesse: {{interesse}}"}}
  ]',
  '[
    {"id": "e1", "source": "start_1", "target": "msg_welcome"},
    {"id": "e2", "source": "msg_welcome", "target": "q_name"},
    {"id": "e3", "source": "q_name", "target": "q_email"},
    {"id": "e4", "source": "q_email", "target": "q_interesse"},
    {"id": "e5", "source": "q_interesse", "target": "msg_thanks"},
    {"id": "e6", "source": "msg_thanks", "target": "handoff_1"}
  ]',
  true,
  NULL
),
(
  'Agendamento',
  'Permite que o cliente agende um horário',
  'agendamento',
  '[
    {"id": "start_1", "type": "start", "position": {"x": 250, "y": 0}, "data": {"label": "Início"}},
    {"id": "msg_welcome", "type": "message", "position": {"x": 250, "y": 100}, "data": {"content": "Olá! Vamos agendar seu atendimento. 📅"}},
    {"id": "q_service", "type": "menu", "position": {"x": 250, "y": 200}, "data": {"title": "Qual serviço você deseja agendar?", "options": [{"id": "1", "label": "Consulta", "value": "consulta"}, {"id": "2", "label": "Avaliação", "value": "avaliacao"}, {"id": "3", "label": "Retorno", "value": "retorno"}]}},
    {"id": "q_date", "type": "question", "position": {"x": 250, "y": 300}, "data": {"question": "Qual data você prefere? (ex: 15/01/2025)", "variableName": "data", "validation": "text"}},
    {"id": "q_time", "type": "menu", "position": {"x": 250, "y": 400}, "data": {"title": "Qual horário?", "options": [{"id": "1", "label": "Manhã (9h-12h)", "value": "manha"}, {"id": "2", "label": "Tarde (14h-18h)", "value": "tarde"}]}},
    {"id": "msg_confirm", "type": "message", "position": {"x": 250, "y": 500}, "data": {"content": "Ótimo! Agendamento solicitado para {{data}} no período da {{horario}}. Nossa equipe confirmará em breve!"}}
  ]',
  '[
    {"id": "e1", "source": "start_1", "target": "msg_welcome"},
    {"id": "e2", "source": "msg_welcome", "target": "q_service"},
    {"id": "e3", "source": "q_service", "target": "q_date"},
    {"id": "e4", "source": "q_date", "target": "q_time"},
    {"id": "e5", "source": "q_time", "target": "msg_confirm"}
  ]',
  true,
  NULL
)
ON CONFLICT DO NOTHING;
