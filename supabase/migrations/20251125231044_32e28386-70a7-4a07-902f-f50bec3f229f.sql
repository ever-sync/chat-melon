-- Adiciona campos do Google Calendar à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS google_calendar_token JSONB,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_email TEXT;

-- Cria tabela para sincronização de eventos
CREATE TABLE IF NOT EXISTS calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_direction TEXT CHECK (sync_direction IN ('crm_to_calendar', 'calendar_to_crm', 'bidirectional')) DEFAULT 'bidirectional',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id)
);

-- Enable RLS
ALTER TABLE calendar_sync ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can view their own calendar sync"
  ON calendar_sync FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can insert their own calendar sync"
  ON calendar_sync FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can update their own calendar sync"
  ON calendar_sync FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can delete their own calendar sync"
  ON calendar_sync FOR DELETE
  USING (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_calendar_sync_user ON calendar_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_task ON calendar_sync(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_google_event ON calendar_sync(google_event_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_calendar_sync_updated_at ON calendar_sync;
CREATE TRIGGER update_calendar_sync_updated_at
  BEFORE UPDATE ON calendar_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();