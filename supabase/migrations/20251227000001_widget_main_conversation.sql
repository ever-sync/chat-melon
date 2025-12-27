-- Add main_conversation_id to widget_conversations for chat integration
ALTER TABLE widget_conversations 
ADD COLUMN IF NOT EXISTS main_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_widget_conversations_main_conv 
ON widget_conversations(main_conversation_id);

-- Comment
COMMENT ON COLUMN widget_conversations.main_conversation_id IS 'Links widget conversation to main conversations table for agent chat integration';
