-- =====================================================
-- Response Time Metrics - Cálculo de tempo de resposta
-- =====================================================

-- Função para calcular tempo médio de resposta
CREATE OR REPLACE FUNCTION calculate_avg_response_time(
  p_company_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL
)
RETURNS TABLE (
  avg_response_seconds NUMERIC,
  avg_response_formatted TEXT,
  total_responses INTEGER,
  fastest_response_seconds NUMERIC,
  slowest_response_seconds NUMERIC,
  responses_under_5min INTEGER,
  responses_under_30min INTEGER,
  responses_over_30min INTEGER
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
  v_end_date TIMESTAMPTZ := COALESCE(p_end_date, NOW());
BEGIN
  RETURN QUERY
  WITH response_times AS (
    SELECT
      m.id,
      m.conversation_id,
      m.created_at as response_time,
      m.sender_id,
      -- Find the previous customer message in the same conversation
      (
        SELECT prev.created_at
        FROM messages prev
        WHERE prev.conversation_id = m.conversation_id
          AND prev.is_from_me = false
          AND prev.created_at < m.created_at
        ORDER BY prev.created_at DESC
        LIMIT 1
      ) as customer_message_time
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.company_id = p_company_id
      AND m.is_from_me = true
      AND m.created_at BETWEEN v_start_date AND v_end_date
      AND (p_agent_id IS NULL OR m.sender_id = p_agent_id)
  ),
  calculated_times AS (
    SELECT
      rt.id,
      EXTRACT(EPOCH FROM (rt.response_time - rt.customer_message_time)) as response_seconds
    FROM response_times rt
    WHERE rt.customer_message_time IS NOT NULL
      AND rt.response_time > rt.customer_message_time
      -- Ignore responses to messages from more than 24 hours ago (likely not direct responses)
      AND (rt.response_time - rt.customer_message_time) < INTERVAL '24 hours'
  )
  SELECT
    ROUND(AVG(ct.response_seconds)::NUMERIC, 2) as avg_response_seconds,
    CASE
      WHEN AVG(ct.response_seconds) IS NULL THEN '0s'
      WHEN AVG(ct.response_seconds) < 60 THEN ROUND(AVG(ct.response_seconds)::NUMERIC, 0)::TEXT || 's'
      WHEN AVG(ct.response_seconds) < 3600 THEN ROUND((AVG(ct.response_seconds) / 60)::NUMERIC, 1)::TEXT || 'min'
      ELSE ROUND((AVG(ct.response_seconds) / 3600)::NUMERIC, 1)::TEXT || 'h'
    END as avg_response_formatted,
    COUNT(*)::INTEGER as total_responses,
    ROUND(MIN(ct.response_seconds)::NUMERIC, 2) as fastest_response_seconds,
    ROUND(MAX(ct.response_seconds)::NUMERIC, 2) as slowest_response_seconds,
    COUNT(*) FILTER (WHERE ct.response_seconds <= 300)::INTEGER as responses_under_5min,
    COUNT(*) FILTER (WHERE ct.response_seconds <= 1800)::INTEGER as responses_under_30min,
    COUNT(*) FILTER (WHERE ct.response_seconds > 1800)::INTEGER as responses_over_30min
  FROM calculated_times ct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular tempo de resposta por agente
CREATE OR REPLACE FUNCTION calculate_response_time_by_agent(
  p_company_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  agent_email TEXT,
  avg_response_seconds NUMERIC,
  avg_response_formatted TEXT,
  total_responses INTEGER,
  fastest_response_seconds NUMERIC
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
  v_end_date TIMESTAMPTZ := COALESCE(p_end_date, NOW());
BEGIN
  RETURN QUERY
  WITH response_times AS (
    SELECT
      m.id,
      m.conversation_id,
      m.created_at as response_time,
      m.sender_id,
      (
        SELECT prev.created_at
        FROM messages prev
        WHERE prev.conversation_id = m.conversation_id
          AND prev.is_from_me = false
          AND prev.created_at < m.created_at
        ORDER BY prev.created_at DESC
        LIMIT 1
      ) as customer_message_time
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.company_id = p_company_id
      AND m.is_from_me = true
      AND m.created_at BETWEEN v_start_date AND v_end_date
      AND m.sender_id IS NOT NULL
  ),
  calculated_times AS (
    SELECT
      rt.id,
      rt.sender_id,
      EXTRACT(EPOCH FROM (rt.response_time - rt.customer_message_time)) as response_seconds
    FROM response_times rt
    WHERE rt.customer_message_time IS NOT NULL
      AND rt.response_time > rt.customer_message_time
      AND (rt.response_time - rt.customer_message_time) < INTERVAL '24 hours'
  )
  SELECT
    p.id as agent_id,
    p.full_name as agent_name,
    p.email as agent_email,
    ROUND(AVG(ct.response_seconds)::NUMERIC, 2) as avg_response_seconds,
    CASE
      WHEN AVG(ct.response_seconds) IS NULL THEN '0s'
      WHEN AVG(ct.response_seconds) < 60 THEN ROUND(AVG(ct.response_seconds)::NUMERIC, 0)::TEXT || 's'
      WHEN AVG(ct.response_seconds) < 3600 THEN ROUND((AVG(ct.response_seconds) / 60)::NUMERIC, 1)::TEXT || 'min'
      ELSE ROUND((AVG(ct.response_seconds) / 3600)::NUMERIC, 1)::TEXT || 'h'
    END as avg_response_formatted,
    COUNT(*)::INTEGER as total_responses,
    ROUND(MIN(ct.response_seconds)::NUMERIC, 2) as fastest_response_seconds
  FROM calculated_times ct
  JOIN profiles p ON p.id = ct.sender_id
  GROUP BY p.id, p.full_name, p.email
  ORDER BY AVG(ct.response_seconds) ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular tempo de resposta por hora do dia
CREATE OR REPLACE FUNCTION calculate_response_time_by_hour(
  p_company_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  hour_of_day INTEGER,
  avg_response_seconds NUMERIC,
  total_responses INTEGER
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
  v_end_date TIMESTAMPTZ := COALESCE(p_end_date, NOW());
BEGIN
  RETURN QUERY
  WITH response_times AS (
    SELECT
      m.id,
      m.conversation_id,
      m.created_at as response_time,
      EXTRACT(HOUR FROM m.created_at)::INTEGER as hour_of_day,
      (
        SELECT prev.created_at
        FROM messages prev
        WHERE prev.conversation_id = m.conversation_id
          AND prev.is_from_me = false
          AND prev.created_at < m.created_at
        ORDER BY prev.created_at DESC
        LIMIT 1
      ) as customer_message_time
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.company_id = p_company_id
      AND m.is_from_me = true
      AND m.created_at BETWEEN v_start_date AND v_end_date
  ),
  calculated_times AS (
    SELECT
      rt.id,
      rt.hour_of_day,
      EXTRACT(EPOCH FROM (rt.response_time - rt.customer_message_time)) as response_seconds
    FROM response_times rt
    WHERE rt.customer_message_time IS NOT NULL
      AND rt.response_time > rt.customer_message_time
      AND (rt.response_time - rt.customer_message_time) < INTERVAL '24 hours'
  )
  SELECT
    ct.hour_of_day,
    ROUND(AVG(ct.response_seconds)::NUMERIC, 2) as avg_response_seconds,
    COUNT(*)::INTEGER as total_responses
  FROM calculated_times ct
  GROUP BY ct.hour_of_day
  ORDER BY ct.hour_of_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular tendência de tempo de resposta (últimos 7 dias vs 7 dias anteriores)
CREATE OR REPLACE FUNCTION calculate_response_time_trend(
  p_company_id UUID
)
RETURNS TABLE (
  current_period_avg NUMERIC,
  previous_period_avg NUMERIC,
  trend_percentage NUMERIC,
  trend_direction TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT avg_response_seconds
    FROM calculate_avg_response_time(
      p_company_id,
      NOW() - INTERVAL '7 days',
      NOW()
    )
  ),
  previous_period AS (
    SELECT avg_response_seconds
    FROM calculate_avg_response_time(
      p_company_id,
      NOW() - INTERVAL '14 days',
      NOW() - INTERVAL '7 days'
    )
  )
  SELECT
    cp.avg_response_seconds as current_period_avg,
    pp.avg_response_seconds as previous_period_avg,
    CASE
      WHEN pp.avg_response_seconds IS NULL OR pp.avg_response_seconds = 0 THEN 0
      ELSE ROUND(((cp.avg_response_seconds - pp.avg_response_seconds) / pp.avg_response_seconds * 100)::NUMERIC, 1)
    END as trend_percentage,
    CASE
      WHEN cp.avg_response_seconds IS NULL OR pp.avg_response_seconds IS NULL THEN 'neutral'
      WHEN cp.avg_response_seconds < pp.avg_response_seconds THEN 'improving'
      WHEN cp.avg_response_seconds > pp.avg_response_seconds THEN 'declining'
      ELSE 'stable'
    END as trend_direction
  FROM current_period cp, previous_period pp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para primeira resposta (First Response Time - FRT)
CREATE OR REPLACE FUNCTION calculate_first_response_time(
  p_company_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  avg_frt_seconds NUMERIC,
  avg_frt_formatted TEXT,
  total_conversations INTEGER,
  frt_under_5min INTEGER,
  frt_under_15min INTEGER,
  frt_under_1hour INTEGER,
  frt_over_1hour INTEGER
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
  v_end_date TIMESTAMPTZ := COALESCE(p_end_date, NOW());
BEGIN
  RETURN QUERY
  WITH first_responses AS (
    SELECT
      c.id as conversation_id,
      -- First customer message
      (
        SELECT MIN(m1.created_at)
        FROM messages m1
        WHERE m1.conversation_id = c.id AND m1.is_from_me = false
      ) as first_customer_message,
      -- First agent response after first customer message
      (
        SELECT MIN(m2.created_at)
        FROM messages m2
        WHERE m2.conversation_id = c.id
          AND m2.is_from_me = true
          AND m2.created_at > (
            SELECT MIN(m3.created_at)
            FROM messages m3
            WHERE m3.conversation_id = c.id AND m3.is_from_me = false
          )
      ) as first_agent_response
    FROM conversations c
    WHERE c.company_id = p_company_id
      AND c.created_at BETWEEN v_start_date AND v_end_date
  ),
  calculated_frt AS (
    SELECT
      fr.conversation_id,
      EXTRACT(EPOCH FROM (fr.first_agent_response - fr.first_customer_message)) as frt_seconds
    FROM first_responses fr
    WHERE fr.first_customer_message IS NOT NULL
      AND fr.first_agent_response IS NOT NULL
      AND fr.first_agent_response > fr.first_customer_message
      AND (fr.first_agent_response - fr.first_customer_message) < INTERVAL '24 hours'
  )
  SELECT
    ROUND(AVG(frt.frt_seconds)::NUMERIC, 2) as avg_frt_seconds,
    CASE
      WHEN AVG(frt.frt_seconds) IS NULL THEN '0s'
      WHEN AVG(frt.frt_seconds) < 60 THEN ROUND(AVG(frt.frt_seconds)::NUMERIC, 0)::TEXT || 's'
      WHEN AVG(frt.frt_seconds) < 3600 THEN ROUND((AVG(frt.frt_seconds) / 60)::NUMERIC, 1)::TEXT || 'min'
      ELSE ROUND((AVG(frt.frt_seconds) / 3600)::NUMERIC, 1)::TEXT || 'h'
    END as avg_frt_formatted,
    COUNT(*)::INTEGER as total_conversations,
    COUNT(*) FILTER (WHERE frt.frt_seconds <= 300)::INTEGER as frt_under_5min,
    COUNT(*) FILTER (WHERE frt.frt_seconds <= 900)::INTEGER as frt_under_15min,
    COUNT(*) FILTER (WHERE frt.frt_seconds <= 3600)::INTEGER as frt_under_1hour,
    COUNT(*) FILTER (WHERE frt.frt_seconds > 3600)::INTEGER as frt_over_1hour
  FROM calculated_frt frt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION calculate_avg_response_time(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_response_time_by_agent(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_response_time_by_hour(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_response_time_trend(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_first_response_time(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
