-- Migration: Conversation Snooze
-- Description: Adds ability to snooze conversations

-- Add snooze columns to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS snoozed_by UUID REFERENCES profiles(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS snooze_reason VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS snoozed_at TIMESTAMPTZ;

-- Index for finding snoozed conversations efficiently
CREATE INDEX IF NOT EXISTS idx_conversations_snoozed
ON conversations(snoozed_until)
WHERE snoozed_until IS NOT NULL;

-- Index for company + snoozed queries
CREATE INDEX IF NOT EXISTS idx_conversations_company_snoozed
ON conversations(company_id, snoozed_until)
WHERE snoozed_until IS NOT NULL;

-- CREATE TABLE IF NOT EXISTS for snooze history (audit trail)
CREATE TABLE IF NOT EXISTS conversation_snooze_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  snoozed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  snoozed_until TIMESTAMPTZ NOT NULL,
  reason VARCHAR(255),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for snooze history
CREATE INDEX IF NOT EXISTS idx_snooze_history_conversation
ON conversation_snooze_history(conversation_id, created_at DESC);

-- RLS for snooze history
ALTER TABLE conversation_snooze_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view snooze history in their company" ON conversation_snooze_history;
CREATE POLICY "Users can view snooze history in their company" ON conversation_snooze_history
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can insert snooze history" ON conversation_snooze_history;
CREATE POLICY "Users can insert snooze history" ON conversation_snooze_history
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update snooze history" ON conversation_snooze_history;
CREATE POLICY "Users can update snooze history" ON conversation_snooze_history
  FOR UPDATE USING (company_id = get_user_company(auth.uid()));

-- Function to handle snooze expiration
CREATE OR REPLACE FUNCTION handle_snooze_expiration()
RETURNS void AS $$
DECLARE
  expired_conv RECORD;
BEGIN
  -- Find and unsnooze expired conversations
  FOR expired_conv IN
    SELECT id, company_id
    FROM conversations
    WHERE snoozed_until IS NOT NULL
      AND snoozed_until <= NOW()
  LOOP
    -- Update conversation
    UPDATE conversations
    SET
      snoozed_until = NULL,
      snoozed_by = NULL,
      snooze_reason = NULL
    WHERE id = expired_conv.id;

    -- Update history
    UPDATE conversation_snooze_history
    SET expired_at = NOW()
    WHERE conversation_id = expired_conv.id
      AND expired_at IS NULL
      AND cancelled_at IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to snooze a conversation
CREATE OR REPLACE FUNCTION snooze_conversation(
  p_conversation_id UUID,
  p_until TIMESTAMPTZ,
  p_reason VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  v_company_id := get_user_company(v_user_id);

  -- Update conversation
  UPDATE conversations
  SET
    snoozed_until = p_until,
    snoozed_by = v_user_id,
    snooze_reason = p_reason,
    snoozed_at = NOW()
  WHERE id = p_conversation_id
    AND company_id = v_company_id
  RETURNING jsonb_build_object(
    'id', id,
    'snoozed_until', snoozed_until,
    'snooze_reason', snooze_reason
  ) INTO v_result;

  -- Create history record
  INSERT INTO conversation_snooze_history (
    conversation_id,
    company_id,
    snoozed_by,
    snoozed_until,
    reason
  ) VALUES (
    p_conversation_id,
    v_company_id,
    v_user_id,
    p_until,
    p_reason
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unsnooze a conversation
CREATE OR REPLACE FUNCTION unsnooze_conversation(p_conversation_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  v_company_id := get_user_company(v_user_id);

  -- Update conversation
  UPDATE conversations
  SET
    snoozed_until = NULL,
    snoozed_by = NULL,
    snooze_reason = NULL,
    snoozed_at = NULL
  WHERE id = p_conversation_id
    AND company_id = v_company_id
  RETURNING jsonb_build_object('id', id) INTO v_result;

  -- Update history
  UPDATE conversation_snooze_history
  SET
    cancelled_at = NOW(),
    cancelled_by = v_user_id
  WHERE conversation_id = p_conversation_id
    AND expired_at IS NULL
    AND cancelled_at IS NULL;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on columns
COMMENT ON COLUMN conversations.snoozed_until IS 'When the snooze expires and conversation reappears';
COMMENT ON COLUMN conversations.snoozed_by IS 'User who snoozed the conversation';
COMMENT ON COLUMN conversations.snooze_reason IS 'Optional reason for snoozing';
COMMENT ON COLUMN conversations.snoozed_at IS 'When the conversation was snoozed';
