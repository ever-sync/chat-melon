-- Update message_type to support internal notes and system messages
COMMENT ON COLUMN messages.message_type IS 'Type of message: text, image, video, audio, document, location, contact, sticker, poll, list, internal_note, system, transfer';

-- Create index for filtering by message type
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type) WHERE message_type IN ('internal_note', 'system', 'transfer');