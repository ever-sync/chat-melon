-- Migration: API Keys & Webhooks
-- Description: Tables for public API authentication and webhook management

-- API Keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Identification
  name VARCHAR(100) NOT NULL,
  description TEXT,
  key_hash VARCHAR(64) NOT NULL, -- SHA256 hash of the key
  key_prefix VARCHAR(10) NOT NULL, -- First chars for identification (e.g., "mk_live_")

  -- Permissions
  permissions TEXT[] DEFAULT ARRAY['read'], -- read, write, delete, admin
  scopes TEXT[] DEFAULT ARRAY['*'], -- contacts, conversations, deals, etc.

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Usage tracking
  total_requests BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_used_ip VARCHAR(45),

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  revoked_reason TEXT,

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API request logs (for debugging and analytics)
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Request info
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  request_body JSONB,
  headers JSONB,

  -- Response info
  status_code INTEGER,
  response_body JSONB,
  error_message TEXT,

  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook endpoints
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Configuration
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(64) NOT NULL, -- For HMAC signature

  -- Events to subscribe
  events TEXT[] NOT NULL, -- ['message.received', 'deal.created', etc.]

  -- Status
  enabled BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Reliability
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  disabled_at TIMESTAMPTZ, -- Auto-disabled after too many failures

  -- Statistics
  total_deliveries BIGINT DEFAULT 0,
  successful_deliveries BIGINT DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  avg_response_time_ms INTEGER,

  -- Headers
  custom_headers JSONB DEFAULT '{}',

  -- Retry policy
  retry_count INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Event info
  event_type VARCHAR(100) NOT NULL,
  event_id UUID NOT NULL, -- Unique event ID for deduplication
  payload JSONB NOT NULL,

  -- Delivery info
  attempt_number INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, retrying

  -- Response
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,

  -- Timing
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error handling
  error_message TEXT,
  next_retry_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_company ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_company ON api_request_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_key ON api_request_logs(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_company ON webhook_endpoints(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint ON webhook_logs(endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_retry ON webhook_logs(status, next_retry_at)
  WHERE status = 'retrying';

-- Partitioning for logs (optional - for high volume)
-- Consider partitioning api_request_logs and webhook_logs by created_at

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view API keys in their company" ON api_keys
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can manage API keys" ON api_keys
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) AND
    has_role(auth.uid(), company_id, 'admin'::app_role)
  );

-- API request logs policies
CREATE POLICY "Users can view API logs in their company" ON api_request_logs
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Service role can insert API logs" ON api_request_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Webhook endpoints policies
CREATE POLICY "Users can view webhooks in their company" ON webhook_endpoints
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can manage webhooks" ON webhook_endpoints
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) AND
    has_role(auth.uid(), company_id, 'admin'::app_role)
  );

-- Webhook logs policies
CREATE POLICY "Users can view webhook logs in their company" ON webhook_logs
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Service role can manage webhook logs" ON webhook_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Functions

-- Function to validate API key and return company info
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash VARCHAR(64))
RETURNS TABLE (
  company_id UUID,
  api_key_id UUID,
  permissions TEXT[],
  scopes TEXT[],
  rate_limit_per_minute INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.company_id,
    ak.id as api_key_id,
    ak.permissions,
    ak.scopes,
    ak.rate_limit_per_minute
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    AND ak.revoked_at IS NULL;

  -- Update last used
  UPDATE api_keys
  SET
    last_used_at = NOW(),
    total_requests = total_requests + 1
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger webhooks for an event
CREATE OR REPLACE FUNCTION trigger_webhooks(
  p_company_id UUID,
  p_event_type VARCHAR(100),
  p_payload JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_endpoint RECORD;
  v_event_id UUID;
BEGIN
  v_event_id := gen_random_uuid();

  FOR v_endpoint IN
    SELECT id
    FROM webhook_endpoints
    WHERE company_id = p_company_id
      AND enabled = true
      AND p_event_type = ANY(events)
      AND (disabled_at IS NULL)
  LOOP
    INSERT INTO webhook_logs (
      endpoint_id,
      company_id,
      event_type,
      event_id,
      payload,
      status
    ) VALUES (
      v_endpoint.id,
      p_company_id,
      p_event_type,
      v_event_id,
      p_payload,
      'pending'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_api_logs(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM api_request_logs
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  DELETE FROM webhook_logs
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for external integrations';
COMMENT ON TABLE api_request_logs IS 'Logs of API requests for debugging and analytics';
COMMENT ON TABLE webhook_endpoints IS 'Webhook endpoints configured by companies';
COMMENT ON TABLE webhook_logs IS 'Logs of webhook deliveries';
COMMENT ON FUNCTION validate_api_key IS 'Validates an API key and returns company info';
COMMENT ON FUNCTION trigger_webhooks IS 'Queues webhooks for an event';

-- Webhook events documentation
COMMENT ON COLUMN webhook_endpoints.events IS 'Available events: message.received, message.sent, message.delivered, message.read, conversation.created, conversation.resolved, conversation.closed, contact.created, contact.updated, deal.created, deal.updated, deal.stage_changed, deal.won, deal.lost, task.created, task.completed, proposal.viewed, proposal.accepted, proposal.rejected';
