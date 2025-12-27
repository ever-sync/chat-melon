-- Função unificada para buscar todas as métricas do dashboard em uma única query
-- Esta função retorna um JSONB com todas as métricas, evitando múltiplas queries

CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_conversation_metrics RECORD;
  v_deal_metrics RECORD;
  v_task_metrics RECORD;
  v_recent_conversations JSONB;
  v_agent_stats JSONB;
BEGIN
  -- Buscar métricas de conversas da view materializada
  SELECT 
    total_open,
    total_closed,
    total_conversations,
    total_unread,
    total_waiting,
    total_active,
    total_chatbot,
    total_re_entry,
    last_activity
  INTO v_conversation_metrics
  FROM dashboard_conversation_metrics
  WHERE company_id = p_company_id;

  -- Buscar métricas de deals da view materializada
  SELECT 
    total_open,
    total_won,
    total_lost,
    total_deals,
    total_value_open,
    total_revenue,
    avg_deal_value
  INTO v_deal_metrics
  FROM dashboard_deal_metrics
  WHERE company_id = p_company_id;

  -- Buscar métricas de tarefas da view materializada
  SELECT 
    total_pending,
    total_completed,
    total_in_progress,
    total_tasks,
    total_overdue
  INTO v_task_metrics
  FROM dashboard_task_metrics
  WHERE company_id = p_company_id;

  -- Buscar conversas recentes (últimas 10)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'contact_name', contact_name,
        'contact_number', contact_number,
        'last_message', last_message,
        'last_message_time', last_message_time,
        'status', status,
        'unread_count', unread_count,
        'profile_pic_url', profile_pic_url
      )
      ORDER BY last_message_time DESC
    ),
    '[]'::jsonb
  )
  INTO v_recent_conversations
  FROM (
    SELECT 
      c.id,
      c.contact_name,
      c.contact_number,
      c.last_message,
      c.last_message_time,
      c.status,
      c.unread_count,
      c.profile_pic_url
    FROM conversations c
    WHERE c.company_id = p_company_id
      AND c.status != 'closed'
      AND c.deleted_at IS NULL
    ORDER BY c.last_message_time DESC
    LIMIT 10
  ) recent;

  -- Buscar estatísticas de agentes (últimas 24h)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'agent_id', agent_id,
        'conversations_handled', conversations_handled,
        'conversations_closed_24h', conversations_closed_24h,
        'avg_resolution_time_minutes', avg_resolution_time_minutes,
        'messages_sent_24h', messages_sent_24h
      )
    ),
    '[]'::jsonb
  )
  INTO v_agent_stats
  FROM dashboard_agent_performance
  WHERE company_id = p_company_id;

  -- Construir resultado JSONB
  v_result := jsonb_build_object(
    'conversations', jsonb_build_object(
      'total_open', COALESCE(v_conversation_metrics.total_open, 0),
      'total_closed', COALESCE(v_conversation_metrics.total_closed, 0),
      'total', COALESCE(v_conversation_metrics.total_conversations, 0),
      'total_unread', COALESCE(v_conversation_metrics.total_unread, 0),
      'total_waiting', COALESCE(v_conversation_metrics.total_waiting, 0),
      'total_active', COALESCE(v_conversation_metrics.total_active, 0),
      'total_chatbot', COALESCE(v_conversation_metrics.total_chatbot, 0),
      'total_re_entry', COALESCE(v_conversation_metrics.total_re_entry, 0),
      'last_activity', v_conversation_metrics.last_activity
    ),
    'deals', jsonb_build_object(
      'total_open', COALESCE(v_deal_metrics.total_open, 0),
      'total_won', COALESCE(v_deal_metrics.total_won, 0),
      'total_lost', COALESCE(v_deal_metrics.total_lost, 0),
      'total', COALESCE(v_deal_metrics.total_deals, 0),
      'total_value_open', COALESCE(v_deal_metrics.total_value_open, 0),
      'total_revenue', COALESCE(v_deal_metrics.total_revenue, 0),
      'avg_deal_value', COALESCE(v_deal_metrics.avg_deal_value, 0)
    ),
    'tasks', jsonb_build_object(
      'total_pending', COALESCE(v_task_metrics.total_pending, 0),
      'total_completed', COALESCE(v_task_metrics.total_completed, 0),
      'total_in_progress', COALESCE(v_task_metrics.total_in_progress, 0),
      'total', COALESCE(v_task_metrics.total_tasks, 0),
      'total_overdue', COALESCE(v_task_metrics.total_overdue, 0)
    ),
    'recent_conversations', v_recent_conversations,
    'agent_stats', v_agent_stats
  );

  RETURN v_result;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION get_dashboard_metrics(UUID) IS 'Retorna todas as métricas do dashboard em uma única query JSONB. Usa views materializadas para performance.';

-- Grant de permissões
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID) TO authenticated;

