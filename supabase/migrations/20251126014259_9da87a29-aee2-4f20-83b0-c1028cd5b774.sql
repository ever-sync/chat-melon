-- =====================================================
-- CAMPOS NA TABELA CONVERSATIONS
-- =====================================================

-- Adicionar campos de controle da IA
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_mode TEXT DEFAULT 'auto' 
  CHECK (ai_mode IN ('auto', 'suggestion', 'off'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_paused_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_paused_by UUID REFERENCES profiles(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_paused_reason TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_messages_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_handoff_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_handoff_reason TEXT;

-- Resumo e insights
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_summary_updated_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_next_step_suggestion TEXT;

-- =====================================================
-- CAMPOS NA TABELA MESSAGES
-- =====================================================

-- Identificar se mensagem é da IA
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_from_ai BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_model TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_response_time_ms INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_intent_detected TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_sentiment TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_suggested_response TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_was_edited BOOLEAN DEFAULT false;

-- =====================================================
-- TABELA DE INSIGHTS DO LEAD
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'product_interest',
    'objection',
    'sentiment_change',
    'intent_detected',
    'budget_mentioned',
    'competitor_mentioned',
    'urgency_detected',
    'decision_maker',
    'best_contact_time',
    'communication_style',
    'pain_point',
    'feature_request',
    'positive_signal',
    'negative_signal',
    'custom'
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  value TEXT,
  confidence NUMERIC DEFAULT 0.8,
  
  source TEXT DEFAULT 'ai',
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  extracted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 10),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TABELA DE SCORE DE QUALIFICAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_qualification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  
  budget_score INTEGER DEFAULT 0 CHECK (budget_score BETWEEN 0 AND 25),
  budget_notes TEXT,
  authority_score INTEGER DEFAULT 0 CHECK (authority_score BETWEEN 0 AND 25),
  authority_notes TEXT,
  need_score INTEGER DEFAULT 0 CHECK (need_score BETWEEN 0 AND 25),
  need_notes TEXT,
  timing_score INTEGER DEFAULT 0 CHECK (timing_score BETWEEN 0 AND 25),
  timing_notes TEXT,
  
  total_score INTEGER GENERATED ALWAYS AS (budget_score + authority_score + need_score + timing_score) STORED,
  
  qualification_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN budget_score + authority_score + need_score + timing_score >= 80 THEN 'hot'
      WHEN budget_score + authority_score + need_score + timing_score >= 50 THEN 'warm'
      WHEN budget_score + authority_score + need_score + timing_score >= 25 THEN 'cool'
      ELSE 'cold'
    END
  ) STORED,
  
  communication_style TEXT CHECK (communication_style IN ('direct', 'detailed', 'emotional', 'analytical')),
  price_sensitivity TEXT CHECK (price_sensitivity IN ('low', 'medium', 'high')),
  decision_speed TEXT CHECK (decision_speed IN ('fast', 'medium', 'slow')),
  preferred_channel TEXT CHECK (preferred_channel IN ('whatsapp', 'email', 'phone', 'any')),
  best_contact_time TEXT,
  best_contact_day TEXT,
  
  ai_generated BOOLEAN DEFAULT true,
  last_updated_by TEXT DEFAULT 'ai',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(contact_id)
);

-- =====================================================
-- TABELA DE MÉTRICAS DA IA
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL,
  
  conversations_handled INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  
  avg_response_time_ms INTEGER DEFAULT 0,
  avg_confidence NUMERIC DEFAULT 0,
  
  handoffs_total INTEGER DEFAULT 0,
  handoffs_requested INTEGER DEFAULT 0,
  handoffs_automatic INTEGER DEFAULT 0,
  handoffs_sentiment INTEGER DEFAULT 0,
  
  resolved_without_human INTEGER DEFAULT 0,
  resolved_with_human INTEGER DEFAULT 0,
  
  intents_detected JSONB DEFAULT '{}',
  
  sentiment_positive INTEGER DEFAULT 0,
  sentiment_neutral INTEGER DEFAULT 0,
  sentiment_negative INTEGER DEFAULT 0,
  
  leads_qualified INTEGER DEFAULT 0,
  deals_created INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, metric_date)
);

-- =====================================================
-- TABELA DE CONFIGURAÇÕES DA IA
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  is_enabled BOOLEAN DEFAULT true,
  default_mode TEXT DEFAULT 'auto' CHECK (default_mode IN ('auto', 'suggestion', 'off')),
  
  personality TEXT DEFAULT 'professional',
  language TEXT DEFAULT 'pt-BR',
  response_delay_ms INTEGER DEFAULT 2000,
  typing_indicator BOOLEAN DEFAULT true,
  
  max_messages_before_handoff INTEGER DEFAULT 10,
  max_response_length INTEGER DEFAULT 500,
  
  handoff_keywords TEXT[] DEFAULT ARRAY['atendente', 'humano', 'pessoa', 'falar com alguém'],
  handoff_on_negative_sentiment BOOLEAN DEFAULT true,
  handoff_on_high_value BOOLEAN DEFAULT true,
  high_value_threshold NUMERIC DEFAULT 5000,
  
  active_hours_start TIME DEFAULT '08:00',
  active_hours_end TIME DEFAULT '22:00',
  active_on_weekends BOOLEAN DEFAULT true,
  fallback_message TEXT DEFAULT 'No momento estamos fora do horário de atendimento. Retornaremos em breve!',
  
  n8n_webhook_url TEXT,
  n8n_api_key TEXT,
  
  system_prompt TEXT,
  greeting_message TEXT,
  handoff_message TEXT DEFAULT 'Vou transferir você para um de nossos especialistas. Um momento!',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id)
);

-- =====================================================
-- TABELA DE SUGESTÕES PARA VENDEDOR
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'response',
    'action',
    'product',
    'objection_handler',
    'upsell',
    'alert',
    'insight'
  )),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'dismissed', 'expired')),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  dismissed_reason TEXT,
  
  trigger_message_id UUID REFERENCES messages(id),
  related_product_id UUID REFERENCES products(id),
  
  confidence NUMERIC DEFAULT 0.8,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lead_insights_contact ON lead_insights(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_insights_conversation ON lead_insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lead_insights_type ON lead_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_lead_insights_active ON lead_insights(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_lead_qualification_contact ON lead_qualification(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_level ON lead_qualification(qualification_level);
CREATE INDEX IF NOT EXISTS idx_lead_qualification_score ON lead_qualification(total_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_company_date ON ai_metrics_daily(company_id, metric_date);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_conversation ON ai_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_messages_ai ON messages(is_from_ai) WHERE is_from_ai = true;
CREATE INDEX IF NOT EXISTS idx_conversations_ai_enabled ON conversations(ai_enabled);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE lead_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_qualification ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view insights in their company" ON lead_insights;
CREATE POLICY "Users can view insights in their company"
  ON lead_insights FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "System can insert insights" ON lead_insights;
CREATE POLICY "System can insert insights"
  ON lead_insights FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view qualification in their company" ON lead_qualification;
CREATE POLICY "Users can view qualification in their company"
  ON lead_qualification FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update qualification in their company" ON lead_qualification;
CREATE POLICY "Users can update qualification in their company"
  ON lead_qualification FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can manage AI settings" ON ai_settings;
CREATE POLICY "Admins can manage AI settings"
  ON ai_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE user_id = auth.uid() 
      AND company_id = ai_settings.company_id 
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view suggestions in their company" ON ai_suggestions;
CREATE POLICY "Users can view suggestions in their company"
  ON ai_suggestions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update suggestions" ON ai_suggestions;
CREATE POLICY "Users can update suggestions"
  ON ai_suggestions FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_lead_qualification_updated_at ON lead_qualification;
CREATE TRIGGER update_lead_qualification_updated_at
  BEFORE UPDATE ON lead_qualification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON ai_settings;
CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CAMPOS NO CONTATO
-- =====================================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_tags TEXT[];
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_qualification_level TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_next_best_action TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_last_analyzed_at TIMESTAMPTZ;