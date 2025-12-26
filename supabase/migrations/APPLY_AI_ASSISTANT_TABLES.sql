-- =====================================================
-- SCRIPT PARA APLICAR MANUALMENTE NO SUPABASE DASHBOARD
-- Execute este SQL na aba SQL Editor do seu projeto Supabase
-- =====================================================

-- 1. Verificar se as tabelas do AI Assistant já existem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_quality_scores') THEN
    -- Criar tabela conversation_quality_scores
    CREATE TABLE conversation_quality_scores (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
      empathy_score INTEGER CHECK (empathy_score >= 0 AND empathy_score <= 100),
      resolution_score INTEGER CHECK (resolution_score >= 0 AND resolution_score <= 100),
      tone_score INTEGER CHECK (tone_score >= 0 AND tone_score <= 100),
      professionalism_score INTEGER CHECK (professionalism_score >= 0 AND professionalism_score <= 100),
      response_quality_score INTEGER CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
      sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
      detected_issues JSONB DEFAULT '[]'::jsonb,
      positive_highlights JSONB DEFAULT '[]'::jsonb,
      improvement_areas JSONB DEFAULT '[]'::jsonb,
      avg_response_time INTEGER,
      message_count INTEGER DEFAULT 0,
      customer_satisfaction INTEGER CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 100),
      analyzed_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: conversation_quality_scores';
  ELSE
    RAISE NOTICE 'Table conversation_quality_scores already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_performance_snapshots') THEN
    CREATE TABLE agent_performance_snapshots (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      active_conversations INTEGER DEFAULT 0,
      waiting_conversations INTEGER DEFAULT 0,
      avg_response_time INTEGER,
      conversations_handled_today INTEGER DEFAULT 0,
      quality_score_today DECIMAL(5,2),
      is_online BOOLEAN DEFAULT false,
      current_load VARCHAR(20) CHECK (current_load IN ('low', 'medium', 'high', 'overloaded')),
      snapshot_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: agent_performance_snapshots';
  ELSE
    RAISE NOTICE 'Table agent_performance_snapshots already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_suggestions') THEN
    CREATE TABLE ai_suggestions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      type VARCHAR(20) CHECK (type IN ('response', 'action', 'alert', 'tip')),
      priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
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
    RAISE NOTICE 'Created table: ai_suggestions';
  ELSE
    RAISE NOTICE 'Table ai_suggestions already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'detected_patterns') THEN
    CREATE TABLE detected_patterns (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      pattern_type VARCHAR(30) CHECK (pattern_type IN ('recurring_issue', 'success_pattern', 'bottleneck', 'performance_trend')),
      pattern_name TEXT NOT NULL,
      description TEXT,
      occurrences INTEGER DEFAULT 1,
      confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
      impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high')),
      recommended_actions JSONB DEFAULT '[]'::jsonb,
      detected_from TIMESTAMPTZ,
      detected_to TIMESTAMPTZ,
      is_resolved BOOLEAN DEFAULT false,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_updated TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: detected_patterns';
  ELSE
    RAISE NOTICE 'Table detected_patterns already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'coaching_insights') THEN
    CREATE TABLE coaching_insights (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      category VARCHAR(20) CHECK (category IN ('strength', 'improvement_area', 'achievement', 'concern')),
      title TEXT NOT NULL,
      description TEXT,
      evidence JSONB DEFAULT '{}'::jsonb,
      recommended_action TEXT,
      priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
      status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved')),
      acknowledged_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created table: coaching_insights';
  ELSE
    RAISE NOTICE 'Table coaching_insights already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assistant_settings') THEN
    CREATE TABLE assistant_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      is_enabled BOOLEAN DEFAULT true,
      position VARCHAR(20) DEFAULT 'bottom-left' CHECK (position IN ('bottom-left', 'bottom-right')),
      notification_level VARCHAR(20) DEFAULT 'all' CHECK (notification_level IN ('all', 'important', 'critical', 'none')),
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
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );
    RAISE NOTICE 'Created table: assistant_settings';
  ELSE
    RAISE NOTICE 'Table assistant_settings already exists';
  END IF;
END $$;

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_quality_scores_conversation ON conversation_quality_scores(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_agent ON conversation_quality_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_quality_scores_company ON conversation_quality_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_agent ON agent_performance_snapshots(agent_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_conversation ON ai_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_agent ON ai_suggestions(agent_id);
CREATE INDEX IF NOT EXISTS idx_patterns_company ON detected_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_coaching_agent ON coaching_insights(agent_id);
CREATE INDEX IF NOT EXISTS idx_assistant_settings_user ON assistant_settings(user_id);

-- 3. Habilitar RLS
ALTER TABLE conversation_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS básicas (permissivas para começar)
DROP POLICY IF EXISTS "allow_all_quality_scores" ON conversation_quality_scores;
CREATE POLICY "allow_all_quality_scores" ON conversation_quality_scores FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_performance_snapshots" ON agent_performance_snapshots;
CREATE POLICY "allow_all_performance_snapshots" ON agent_performance_snapshots FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_ai_suggestions" ON ai_suggestions;
CREATE POLICY "allow_all_ai_suggestions" ON ai_suggestions FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_detected_patterns" ON detected_patterns;
CREATE POLICY "allow_all_detected_patterns" ON detected_patterns FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_coaching_insights" ON coaching_insights;
CREATE POLICY "allow_all_coaching_insights" ON coaching_insights FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_assistant_settings" ON assistant_settings;
CREATE POLICY "allow_all_assistant_settings" ON assistant_settings FOR ALL USING (true);

-- 5. Criar funções auxiliares
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

CREATE OR REPLACE FUNCTION get_agent_avg_response_time(p_agent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_avg_time INTEGER;
BEGIN
  SELECT COALESCE(AVG(avg_response_time), 0)::INTEGER
  INTO v_avg_time
  FROM agent_performance_snapshots
  WHERE agent_id = p_agent_id
  AND snapshot_at >= NOW() - INTERVAL '30 minutes';
  RETURN v_avg_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sucesso!
SELECT 'AI Assistant tables created successfully!' as result;
