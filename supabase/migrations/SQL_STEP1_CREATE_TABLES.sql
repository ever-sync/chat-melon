-- =====================================================
-- PASSO 1: CRIAR TABELAS DO AI ASSISTANT
-- Execute este bloco primeiro
-- =====================================================

-- Tabela: conversation_quality_scores
CREATE TABLE IF NOT EXISTS conversation_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  company_id UUID,
  agent_id UUID,
  overall_score INTEGER,
  empathy_score INTEGER,
  resolution_score INTEGER,
  tone_score INTEGER,
  professionalism_score INTEGER,
  response_quality_score INTEGER,
  sentiment VARCHAR(20),
  detected_issues JSONB DEFAULT '[]'::jsonb,
  positive_highlights JSONB DEFAULT '[]'::jsonb,
  improvement_areas JSONB DEFAULT '[]'::jsonb,
  avg_response_time INTEGER,
  message_count INTEGER DEFAULT 0,
  customer_satisfaction INTEGER,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: agent_performance_snapshots
CREATE TABLE IF NOT EXISTS agent_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID,
  company_id UUID,
  active_conversations INTEGER DEFAULT 0,
  waiting_conversations INTEGER DEFAULT 0,
  avg_response_time INTEGER,
  conversations_handled_today INTEGER DEFAULT 0,
  quality_score_today DECIMAL(5,2),
  is_online BOOLEAN DEFAULT false,
  current_load VARCHAR(20),
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: ai_suggestions
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  agent_id UUID,
  company_id UUID,
  type VARCHAR(20),
  priority VARCHAR(20),
  title TEXT NOT NULL,
  description TEXT,
  suggested_response TEXT,
  reasoning TEXT,
  trigger_context JSONB DEFAULT '{}'::jsonb,
  was_useful BOOLEAN,
  was_used BOOLEAN,
  agent_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Tabela: detected_patterns
CREATE TABLE IF NOT EXISTS detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  agent_id UUID,
  pattern_type VARCHAR(30),
  pattern_name TEXT NOT NULL,
  description TEXT,
  occurrences INTEGER DEFAULT 1,
  confidence_score DECIMAL(5,2),
  impact_level VARCHAR(20),
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  detected_from TIMESTAMPTZ,
  detected_to TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: coaching_insights
CREATE TABLE IF NOT EXISTS coaching_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID,
  company_id UUID,
  manager_id UUID,
  category VARCHAR(20),
  title TEXT NOT NULL,
  description TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  recommended_action TEXT,
  priority VARCHAR(20),
  status VARCHAR(20) DEFAULT 'new',
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: assistant_settings
CREATE TABLE IF NOT EXISTS assistant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  company_id UUID,
  is_enabled BOOLEAN DEFAULT true,
  position VARCHAR(20) DEFAULT 'bottom-left',
  notification_level VARCHAR(20) DEFAULT 'all',
  alert_slow_response BOOLEAN DEFAULT true,
  alert_quality_issues BOOLEAN DEFAULT true,
  alert_customer_frustration BOOLEAN DEFAULT true,
  alert_forgotten_conversations BOOLEAN DEFAULT true,
  slow_response_threshold INTEGER DEFAULT 300,
  quality_threshold INTEGER DEFAULT 70,
  show_response_suggestions BOOLEAN DEFAULT true,
  show_action_suggestions BOOLEAN DEFAULT true,
  show_coaching_tips BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Tabelas criadas com sucesso!' as resultado;
