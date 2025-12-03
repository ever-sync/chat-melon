-- Create internal_messages table for user-to-user chat
CREATE TABLE IF NOT EXISTS internal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  media_url TEXT,
  media_type TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_internal_messages_sender ON internal_messages(sender_id);
CREATE INDEX idx_internal_messages_recipient ON internal_messages(recipient_id);
CREATE INDEX idx_internal_messages_company ON internal_messages(company_id);
CREATE INDEX idx_internal_messages_created_at ON internal_messages(created_at DESC);

-- Create composite index for conversations lookup
CREATE INDEX idx_internal_messages_conversation ON internal_messages(sender_id, recipient_id);

-- Enable RLS
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages they sent or received"
ON internal_messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

CREATE POLICY "Users can send messages"
ON internal_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM company_members cm1
    WHERE cm1.user_id = auth.uid() AND cm1.company_id = internal_messages.company_id
  ) AND
  EXISTS (
    SELECT 1 FROM company_members cm2
    WHERE cm2.user_id = internal_messages.recipient_id AND cm2.company_id = internal_messages.company_id
  )
);

CREATE POLICY "Users can update their own messages"
ON internal_messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
ON internal_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_internal_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_internal_messages_updated_at
  BEFORE UPDATE ON internal_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_internal_messages_updated_at();

-- Create view for online users (based on recent activity)
CREATE OR REPLACE VIEW online_users AS
SELECT DISTINCT
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  cm.company_id,
  cm.display_name,
  CASE
    WHEN u.last_sign_in_at > NOW() - INTERVAL '5 minutes' THEN true
    ELSE false
  END as is_online,
  u.last_sign_in_at
FROM auth.users u
JOIN company_members cm ON cm.user_id = u.id
WHERE cm.is_active = true;

-- Grant permissions
GRANT SELECT ON online_users TO authenticated;
