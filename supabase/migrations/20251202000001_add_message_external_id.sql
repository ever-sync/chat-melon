-- Add external_id field to messages table for webhook deduplication
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_id);

-- Add unique constraint to prevent duplicate messages from webhooks
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id_unique
ON messages(external_id, conversation_id)
WHERE external_id IS NOT NULL;

-- Add RPC function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread(conv_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT unread_count INTO current_count
  FROM conversations
  WHERE id = conv_id;

  RETURN COALESCE(current_count, 0) + 1;
END;
$$ LANGUAGE plpgsql;
