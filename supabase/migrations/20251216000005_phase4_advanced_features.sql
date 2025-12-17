-- =====================================================
-- FASE 4: Advanced Analytics & Integrations Features
-- =====================================================

-- =====================================================
-- 4.1 ADVANCED ANALYTICS FUNCTIONS
-- =====================================================

-- Função para obter métricas gerais do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_company_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_metrics JSONB;
BEGIN
  SELECT jsonb_build_object(
    'conversations', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM conversations WHERE company_id = p_company_id AND created_at BETWEEN p_start_date AND p_end_date),
      'open', (SELECT COUNT(*) FROM conversations WHERE company_id = p_company_id AND status = 'active'),
      'pending', (SELECT COUNT(*) FROM conversations WHERE company_id = p_company_id AND status = 'waiting'),
      'resolved', (SELECT COUNT(*) FROM conversations WHERE company_id = p_company_id AND status = 'closed' AND created_at BETWEEN p_start_date AND p_end_date)
    ),
    'contacts', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id),
      'new', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id AND created_at BETWEEN p_start_date AND p_end_date)
    ),
    'deals', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM deals WHERE company_id = p_company_id),
      'won', (SELECT COUNT(*) FROM deals WHERE company_id = p_company_id AND status = 'won' AND updated_at BETWEEN p_start_date AND p_end_date),
      'lost', (SELECT COUNT(*) FROM deals WHERE company_id = p_company_id AND status = 'lost' AND updated_at BETWEEN p_start_date AND p_end_date),
      'total_value', COALESCE((SELECT SUM(value) FROM deals WHERE company_id = p_company_id AND status = 'won' AND updated_at BETWEEN p_start_date AND p_end_date), 0)
    ),
    'response_time', jsonb_build_object(
      'avg_first_response_minutes', COALESCE((
        SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60)
        FROM conversations
        WHERE company_id = p_company_id
          AND first_response_at IS NOT NULL
          AND created_at BETWEEN p_start_date AND p_end_date
      ), 0),
      'sla_compliance_rate', COALESCE((
        SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE sla_first_response_met = TRUE) / NULLIF(COUNT(*), 0), 2)
        FROM conversations
        WHERE company_id = p_company_id
          AND sla_first_response_met IS NOT NULL
          AND created_at BETWEEN p_start_date AND p_end_date
      ), 0)
    )
  ) INTO v_metrics;

  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gráfico de conversas por período
CREATE OR REPLACE FUNCTION get_conversations_chart(
  p_company_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_interval TEXT DEFAULT 'day' -- day, week, month
)
RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date_trunc(p_interval, created_at),
      'count', count,
      'status_breakdown', status_data
    ) ORDER BY date_trunc(p_interval, created_at)
  ) INTO v_data
  FROM (
    SELECT
      created_at,
      COUNT(*) as count,
      jsonb_object_agg(status, status_count) as status_data
    FROM (
      SELECT
        created_at,
        status,
        COUNT(*) as status_count
      FROM conversations
      WHERE company_id = p_company_id
        AND created_at BETWEEN p_start_date AND p_end_date
      GROUP BY date_trunc(p_interval, created_at), status
    ) sub
    GROUP BY created_at
  ) grouped;

  RETURN COALESCE(v_data, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4.2 TEAM PERFORMANCE METRICS
-- =====================================================

-- View materializada para performance de agentes
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_performance_metrics AS
SELECT
  c.company_id,
  c.assigned_to as agent_id,
  p.full_name as agent_name,
  DATE_TRUNC('day', c.created_at) as date,

  -- Conversas
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE c.status = 'closed') as resolved_conversations,
  COUNT(*) FILTER (WHERE c.status = 'active') as open_conversations,

  -- Tempo de resposta
  AVG(EXTRACT(EPOCH FROM (c.first_response_at - c.created_at)) / 60) as avg_first_response_minutes,
  MIN(EXTRACT(EPOCH FROM (c.first_response_at - c.created_at)) / 60) as min_first_response_minutes,
  MAX(EXTRACT(EPOCH FROM (c.first_response_at - c.created_at)) / 60) as max_first_response_minutes,

  -- SLA
  COUNT(*) FILTER (WHERE c.sla_first_response_met = TRUE) as sla_first_response_met_count,
  COUNT(*) FILTER (WHERE c.sla_first_response_met = FALSE) as sla_first_response_breached_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE c.sla_first_response_met = TRUE) / NULLIF(COUNT(*), 0), 2) as sla_compliance_rate

FROM conversations c
LEFT JOIN profiles p ON p.id = c.assigned_to
WHERE c.assigned_to IS NOT NULL
  AND c.created_at > NOW() - INTERVAL '90 days'
GROUP BY c.company_id, c.assigned_to, p.full_name, DATE_TRUNC('day', c.created_at);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_agent_performance_metrics_lookup
  ON agent_performance_metrics(company_id, agent_id, date DESC);

-- Função para refresh da view materializada (rodar via cron job)
CREATE OR REPLACE FUNCTION refresh_agent_performance_metrics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agent_performance_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter performance de um agente específico
CREATE OR REPLACE FUNCTION get_agent_performance(
  p_agent_id UUID,
  p_company_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_performance JSONB;
BEGIN
  SELECT jsonb_build_object(
    'agent_id', p_agent_id,
    'period', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'summary', jsonb_build_object(
      'total_conversations', SUM(total_conversations),
      'resolved_conversations', SUM(resolved_conversations),
      'avg_first_response_minutes', ROUND(AVG(avg_first_response_minutes)::NUMERIC, 2),
      'avg_resolution_hours', ROUND(AVG(avg_resolution_hours)::NUMERIC, 2),
      'sla_compliance_rate', ROUND(AVG(sla_compliance_rate)::NUMERIC, 2),
      'avg_rating', ROUND(AVG(avg_rating)::NUMERIC, 2)
    ),
    'daily_data', jsonb_agg(
      jsonb_build_object(
        'date', date,
        'conversations', total_conversations,
        'resolved', resolved_conversations,
        'avg_response_time', ROUND(avg_first_response_minutes::NUMERIC, 2)
      ) ORDER BY date
    )
  ) INTO v_performance
  FROM agent_performance_metrics
  WHERE agent_id = p_agent_id
    AND company_id = p_company_id
    AND date BETWEEN p_start_date AND p_end_date
  GROUP BY agent_id;

  RETURN COALESCE(v_performance, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para ranking de agentes
CREATE OR REPLACE FUNCTION get_agents_ranking(
  p_company_id UUID,
  p_metric VARCHAR(50) DEFAULT 'total_conversations', -- total_conversations, sla_compliance_rate, avg_rating
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  v_ranking JSONB;
BEGIN
  CASE p_metric
    WHEN 'total_conversations' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', row_number,
          'agent_id', agent_id,
          'agent_name', agent_name,
          'value', total_conversations
        )
      ) INTO v_ranking
      FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY SUM(total_conversations) DESC) as row_number,
          agent_id,
          agent_name,
          SUM(total_conversations) as total_conversations
        FROM agent_performance_metrics
        WHERE company_id = p_company_id
          AND date BETWEEN p_start_date AND p_end_date
        GROUP BY agent_id, agent_name
        ORDER BY total_conversations DESC
        LIMIT p_limit
      ) ranked;

    WHEN 'sla_compliance_rate' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', row_number,
          'agent_id', agent_id,
          'agent_name', agent_name,
          'value', sla_rate
        )
      ) INTO v_ranking
      FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY AVG(sla_compliance_rate) DESC) as row_number,
          agent_id,
          agent_name,
          ROUND(AVG(sla_compliance_rate)::NUMERIC, 2) as sla_rate
        FROM agent_performance_metrics
        WHERE company_id = p_company_id
          AND date BETWEEN p_start_date AND p_end_date
        GROUP BY agent_id, agent_name
        ORDER BY sla_rate DESC
        LIMIT p_limit
      ) ranked;

    WHEN 'avg_rating' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', row_number,
          'agent_id', agent_id,
          'agent_name', agent_name,
          'value', rating
        )
      ) INTO v_ranking
      FROM (
        SELECT
          ROW_NUMBER() OVER (ORDER BY AVG(avg_rating) DESC NULLS LAST) as row_number,
          agent_id,
          agent_name,
          ROUND(AVG(avg_rating)::NUMERIC, 2) as rating
        FROM agent_performance_metrics
        WHERE company_id = p_company_id
          AND date BETWEEN p_start_date AND p_end_date
          AND avg_rating IS NOT NULL
        GROUP BY agent_id, agent_name
        ORDER BY rating DESC
        LIMIT p_limit
      ) ranked;
  END CASE;

  RETURN COALESCE(v_ranking, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4.3 EXPORT/IMPORT DATA
-- =====================================================

-- Tabela para jobs de exportação
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),

  -- Configuração
  export_type VARCHAR(50) NOT NULL, -- conversations, contacts, deals, reports
  format VARCHAR(20) DEFAULT 'csv', -- csv, xlsx, json
  filters JSONB DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0, -- 0-100

  -- Resultado
  file_url TEXT,
  file_size_bytes BIGINT,
  total_records INTEGER,

  -- Erro
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Link expira após X dias

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_export_jobs_company ON export_jobs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status, created_at);

-- RLS
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage export jobs from their company" ON export_jobs;
CREATE POLICY "Users can manage export jobs from their company" ON export_jobs
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Função para criar job de exportação
CREATE OR REPLACE FUNCTION create_export_job(
  p_company_id UUID,
  p_user_id UUID,
  p_export_type VARCHAR(50),
  p_format VARCHAR(20) DEFAULT 'csv',
  p_filters JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO export_jobs (
    company_id, user_id, export_type, format, filters, status, expires_at
  ) VALUES (
    p_company_id, p_user_id, p_export_type, p_format, p_filters, 'pending', NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_job_id;

  -- Aqui você dispararia um Edge Function ou job assíncrono para processar a exportação
  -- Por enquanto, apenas retornamos o ID

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4.4 WEBHOOKS SYSTEM (Advanced)
-- =====================================================

-- Adicionar campos em webhooks se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhooks' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE webhooks ADD COLUMN retry_count INTEGER DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhooks' AND column_name = 'timeout_seconds'
  ) THEN
    ALTER TABLE webhooks ADD COLUMN timeout_seconds INTEGER DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhooks' AND column_name = 'secret_key'
  ) THEN
    ALTER TABLE webhooks ADD COLUMN secret_key TEXT; -- Para assinatura HMAC
  END IF;
END
$$;

-- Tabela para deliveries de webhooks
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

  -- Evento
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,

  -- Request
  request_url TEXT NOT NULL,
  request_headers JSONB,
  request_body TEXT,

  -- Response
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, retrying
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error
  error_message TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status, next_retry_at);

-- RLS
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view webhook deliveries from their company" ON webhook_deliveries;
CREATE POLICY "Users can view webhook deliveries from their company" ON webhook_deliveries
  FOR SELECT USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

-- Função para criar delivery de webhook
CREATE OR REPLACE FUNCTION create_webhook_delivery(
  p_webhook_id UUID,
  p_event_type VARCHAR(100),
  p_payload JSONB
)
RETURNS UUID AS $$
DECLARE
  v_delivery_id UUID;
  v_webhook RECORD;
BEGIN
  -- Buscar webhook
  SELECT * INTO v_webhook FROM webhooks WHERE id = p_webhook_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Criar delivery
  INSERT INTO webhook_deliveries (
    webhook_id,
    event_type,
    payload,
    request_url,
    max_attempts,
    status,
    next_retry_at
  ) VALUES (
    p_webhook_id,
    p_event_type,
    p_payload,
    v_webhook.url,
    COALESCE(v_webhook.retry_count, 3),
    'pending',
    NOW()
  )
  RETURNING id INTO v_delivery_id;

  -- Aqui você dispararia um Edge Function para fazer a entrega
  -- PERFORM pg_notify('webhook_delivery', v_delivery_id::TEXT);

  RETURN v_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar delivery após tentativa
CREATE OR REPLACE FUNCTION update_webhook_delivery(
  p_delivery_id UUID,
  p_status_code INTEGER,
  p_response_body TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_delivery RECORD;
  v_new_status VARCHAR(20);
  v_next_retry TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_delivery FROM webhook_deliveries WHERE id = p_delivery_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Determinar novo status
  IF p_status_code BETWEEN 200 AND 299 THEN
    v_new_status := 'success';
    v_next_retry := NULL;
  ELSIF v_delivery.attempt_count + 1 >= v_delivery.max_attempts THEN
    v_new_status := 'failed';
    v_next_retry := NULL;
  ELSE
    v_new_status := 'retrying';
    -- Backoff exponencial: 2^attempt minutos
    v_next_retry := NOW() + (POWER(2, v_delivery.attempt_count + 1) || ' minutes')::INTERVAL;
  END IF;

  -- Atualizar delivery
  UPDATE webhook_deliveries
  SET
    attempt_count = attempt_count + 1,
    last_attempt_at = NOW(),
    response_status = p_status_code,
    response_body = p_response_body,
    error_message = p_error_message,
    status = v_new_status,
    next_retry_at = v_next_retry,
    completed_at = CASE WHEN v_new_status IN ('success', 'failed') THEN NOW() ELSE NULL END
  WHERE id = p_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4.5 PUBLIC API RATE LIMITING
-- =====================================================

-- Tabela para rate limiting de API
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,

  -- Janela de tempo
  window_start TIMESTAMPTZ NOT NULL,
  window_duration INTERVAL DEFAULT '1 hour',

  -- Contadores
  request_count INTEGER DEFAULT 0,
  max_requests INTEGER NOT NULL,

  -- Metadata
  last_request_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(api_key_id, window_start)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_key ON api_rate_limits(api_key_id, window_start DESC);

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_api_key_id UUID,
  p_max_requests INTEGER DEFAULT 1000
)
RETURNS JSONB AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_allowed BOOLEAN;
BEGIN
  v_window_start := DATE_TRUNC('hour', NOW());

  -- Buscar ou criar registro de rate limit
  INSERT INTO api_rate_limits (api_key_id, window_start, max_requests, request_count, last_request_at)
  VALUES (p_api_key_id, v_window_start, p_max_requests, 1, NOW())
  ON CONFLICT (api_key_id, window_start)
  DO UPDATE SET
    request_count = api_rate_limits.request_count + 1,
    last_request_at = NOW()
  RETURNING request_count INTO v_current_count;

  v_allowed := v_current_count <= p_max_requests;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current_count', v_current_count,
    'max_requests', p_max_requests,
    'window_start', v_window_start,
    'window_end', v_window_start + INTERVAL '1 hour',
    'reset_at', v_window_start + INTERVAL '1 hour'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4.6 AUDIT LOG (Extended)
-- =====================================================

-- Adicionar campos extras em audit_logs se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN ip_address INET;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN session_id UUID;
  END IF;
END
$$;

-- Função para buscar logs com filtros avançados
CREATE OR REPLACE FUNCTION search_audit_logs(
  p_company_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_action VARCHAR(100) DEFAULT NULL,
  p_resource_type VARCHAR(100) DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_logs JSONB;
  v_total INTEGER;
BEGIN
  -- Contar total
  SELECT COUNT(*) INTO v_total
  FROM audit_logs
  WHERE company_id = p_company_id
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_action IS NULL OR action = p_action)
    AND (p_resource_type IS NULL OR resource_type = p_resource_type)
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Buscar logs
  SELECT jsonb_build_object(
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset,
    'data', jsonb_agg(
      jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'action', action,
        'resource_type', resource_type,
        'resource_id', resource_id,
        'old_data', old_data,
        'new_data', new_data,
        'ip_address', ip_address,
        'user_agent', user_agent,
        'created_at', created_at
      ) ORDER BY created_at DESC
    )
  ) INTO v_logs
  FROM (
    SELECT * FROM audit_logs
    WHERE company_id = p_company_id
      AND (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_action IS NULL OR action = p_action)
      AND (p_resource_type IS NULL OR resource_type = p_resource_type)
      AND created_at BETWEEN p_start_date AND p_end_date
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) logs;

  RETURN COALESCE(v_logs, jsonb_build_object('total', 0, 'data', '[]'::JSONB));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Feature Flags
-- =====================================================

INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES
  ('advanced_analytics', 'Analytics Avançado', 'Dashboards customizáveis e métricas avançadas', 'analytics', true, 'BarChart3', 40),
  ('team_performance', 'Performance da Equipe', 'Métricas e rankings de agentes', 'analytics', true, 'Users', 41),
  ('data_export', 'Exportação de Dados', 'Exportar dados em CSV, Excel e JSON', 'productivity', true, 'Download', 42),
  ('webhooks_advanced', 'Webhooks Avançados', 'Sistema completo de webhooks com retry', 'integration', true, 'Webhook', 43),
  ('api_rate_limiting', 'Rate Limiting API', 'Controle de taxa de requisições da API', 'integration', true, 'Shield', 44),
  ('audit_log_advanced', 'Audit Log Avançado', 'Logs de auditoria com filtros e busca', 'admin', true, 'FileText', 45)
ON CONFLICT (feature_key) DO NOTHING;

-- =====================================================
-- Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversations_chart(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_performance(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agents_ranking(UUID, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_export_job(UUID, UUID, VARCHAR, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_webhook_delivery(UUID, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_api_rate_limit(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_audit_logs(UUID, UUID, VARCHAR, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) TO authenticated;
GRANT SELECT ON agent_performance_metrics TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION get_dashboard_metrics IS 'Retorna métricas gerais para dashboard';
COMMENT ON FUNCTION get_agent_performance IS 'Retorna performance detalhada de um agente';
COMMENT ON FUNCTION get_agents_ranking IS 'Retorna ranking de agentes por métrica';
COMMENT ON FUNCTION create_export_job IS 'Cria job de exportação de dados';
COMMENT ON FUNCTION check_api_rate_limit IS 'Verifica e atualiza rate limit de API key';
COMMENT ON TABLE webhook_deliveries IS 'Histórico de entregas de webhooks';
COMMENT ON TABLE export_jobs IS 'Jobs de exportação de dados';
COMMENT ON TABLE api_rate_limits IS 'Controle de rate limiting por API key';
