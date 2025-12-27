-- Materialized Views para otimizar métricas do dashboard
-- Estas views são atualizadas automaticamente a cada 5 minutos via cron job

-- View materializada para métricas de conversas por empresa
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_conversation_metrics AS
SELECT 
  company_id,
  COUNT(*) FILTER (WHERE status != 'closed') as total_open,
  COUNT(*) FILTER (WHERE status = 'closed') as total_closed,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE unread_count > 0) as total_unread,
  COUNT(*) FILTER (WHERE status = 'waiting') as total_waiting,
  COUNT(*) FILTER (WHERE status = 'active') as total_active,
  COUNT(*) FILTER (WHERE status = 'chatbot') as total_chatbot,
  COUNT(*) FILTER (WHERE status = 're_entry') as total_re_entry,
  MAX(last_message_time) as last_activity
FROM conversations
WHERE deleted_at IS NULL
GROUP BY company_id;

-- View materializada para métricas de deals por empresa
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_deal_metrics AS
SELECT 
  company_id,
  COUNT(*) FILTER (WHERE status = 'open') as total_open,
  COUNT(*) FILTER (WHERE status = 'won') as total_won,
  COUNT(*) FILTER (WHERE status = 'lost') as total_lost,
  COUNT(*) as total_deals,
  COALESCE(SUM(value) FILTER (WHERE status = 'open'), 0) as total_value_open,
  COALESCE(SUM(value) FILTER (WHERE status = 'won'), 0) as total_revenue,
  AVG(value) FILTER (WHERE status = 'open') as avg_deal_value
FROM deals
WHERE deleted_at IS NULL
GROUP BY company_id;

-- View materializada para métricas de tarefas por empresa
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_task_metrics AS
SELECT 
  company_id,
  COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
  COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
  COUNT(*) FILTER (WHERE status = 'in_progress') as total_in_progress,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as total_overdue
FROM tasks
WHERE deleted_at IS NULL
GROUP BY company_id;

-- View materializada para performance de agentes (últimas 24h)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_agent_performance AS
SELECT 
  c.company_id,
  c.assigned_to as agent_id,
  COUNT(DISTINCT c.id) as conversations_handled,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'closed' AND c.closed_at > NOW() - INTERVAL '24 hours') as conversations_closed_24h,
  AVG(EXTRACT(EPOCH FROM (c.closed_at - c.created_at)) / 60) FILTER (WHERE c.closed_at IS NOT NULL) as avg_resolution_time_minutes,
  COUNT(DISTINCT m.id) FILTER (WHERE m.is_from_me = true AND m.timestamp > NOW() - INTERVAL '24 hours') as messages_sent_24h
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.deleted_at IS NULL
  AND c.assigned_to IS NOT NULL
  AND (c.last_message_time > NOW() - INTERVAL '24 hours' OR c.closed_at > NOW() - INTERVAL '24 hours')
GROUP BY c.company_id, c.assigned_to;

-- Índices para melhorar performance das views
CREATE INDEX IF NOT EXISTS idx_dashboard_conversation_metrics_company ON dashboard_conversation_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_deal_metrics_company ON dashboard_deal_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_task_metrics_company ON dashboard_task_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_agent_performance_company ON dashboard_agent_performance(company_id, agent_id);

-- Função para refresh das views materializadas
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_conversation_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_deal_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_task_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_agent_performance;
END;
$$;

-- Comentários para documentação
COMMENT ON MATERIALIZED VIEW dashboard_conversation_metrics IS 'Métricas agregadas de conversas por empresa. Atualizada a cada 5 minutos.';
COMMENT ON MATERIALIZED VIEW dashboard_deal_metrics IS 'Métricas agregadas de deals por empresa. Atualizada a cada 5 minutos.';
COMMENT ON MATERIALIZED VIEW dashboard_task_metrics IS 'Métricas agregadas de tarefas por empresa. Atualizada a cada 5 minutos.';
COMMENT ON MATERIALIZED VIEW dashboard_agent_performance IS 'Performance de agentes nas últimas 24h. Atualizada a cada 5 minutos.';
COMMENT ON FUNCTION refresh_dashboard_views() IS 'Atualiza todas as views materializadas do dashboard. Deve ser executada via cron job a cada 5 minutos.';

