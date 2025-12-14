-- Migration: Audio Transcription Support
-- Adds support for automatic audio transcription using Whisper API

-- Add transcription fields to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS audio_transcription TEXT,
ADD COLUMN IF NOT EXISTS transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS transcription_language TEXT,
ADD COLUMN IF NOT EXISTS transcription_confidence FLOAT CHECK (transcription_confidence >= 0 AND transcription_confidence <= 1),
ADD COLUMN IF NOT EXISTS transcription_duration FLOAT, -- Duration in seconds
ADD COLUMN IF NOT EXISTS transcription_provider TEXT DEFAULT 'groq'; -- 'groq', 'openai', 'assemblyai'

-- Create index for searching transcriptions
CREATE INDEX IF NOT EXISTS idx_messages_transcription_search
ON messages USING gin(to_tsvector('portuguese', audio_transcription));

-- Create index for transcription status
CREATE INDEX IF NOT EXISTS idx_messages_transcription_status
ON messages(transcription_status)
WHERE transcription_status IS NOT NULL;

-- Transcription configuration per company
CREATE TABLE IF NOT EXISTS transcription_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'groq' CHECK (provider IN ('groq', 'openai', 'assemblyai')),
  auto_transcribe BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'pt', -- pt, en, es, auto
  model TEXT DEFAULT 'whisper-large-v3',
  api_key TEXT, -- Optional: use custom API key
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS on transcription_configs
ALTER TABLE transcription_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transcription_configs
CREATE POLICY "Users can view their company's transcription config"
ON transcription_configs FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage transcription config"
ON transcription_configs FOR ALL
USING (
  company_id IN (
    SELECT cu.company_id
    FROM company_users cu
    JOIN company_members cm ON cm.user_id = cu.user_id AND cm.company_id = cu.company_id
    WHERE cu.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transcription_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_transcription_config_updated_at_trigger
BEFORE UPDATE ON transcription_configs
FOR EACH ROW
EXECUTE FUNCTION update_transcription_config_updated_at();

-- Create default transcription configs for existing companies
INSERT INTO transcription_configs (company_id, provider, auto_transcribe, language)
SELECT id, 'groq', true, 'pt'
FROM companies
WHERE id NOT IN (SELECT company_id FROM transcription_configs)
ON CONFLICT (company_id) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE transcription_configs IS 'Configuration for automatic audio transcription per company';
COMMENT ON COLUMN messages.audio_transcription IS 'Transcribed text from audio message';
COMMENT ON COLUMN messages.transcription_status IS 'Status of transcription: pending, processing, completed, failed';
COMMENT ON COLUMN messages.transcription_confidence IS 'Confidence score from transcription API (0-1)';
