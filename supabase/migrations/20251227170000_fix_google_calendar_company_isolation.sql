-- Corrigir isolamento do Google Calendar por empresa
-- Problema: Tokens estavam na tabela profiles (por usuário)
-- Solução: Mover para tabela google_calendar_tokens (por empresa + usuário)

-- 1. Criar tabela para tokens do Google Calendar isolados por empresa
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  google_email TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Garante que cada usuário pode ter apenas uma conexão por empresa
  UNIQUE(company_id, user_id)
);

-- 2. Comentar: Migrar dados existentes dos profiles para a nova tabela
-- IMPORTANTE: Esta migração assume que você quer manter as conexões existentes
-- Se você quer forçar reconexão, pode pular esta parte
COMMENT ON TABLE google_calendar_tokens IS 'Tokens do Google Calendar isolados por empresa e usuário';

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_company ON google_calendar_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_company_user ON google_calendar_tokens(company_id, user_id);

-- 4. Enable RLS
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Usuário só vê suas próprias conexões
DROP POLICY IF EXISTS "Users can view their own google calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can view their own google calendar tokens"
  ON google_calendar_tokens FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own google calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can insert their own google calendar tokens"
  ON google_calendar_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own google calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can update their own google calendar tokens"
  ON google_calendar_tokens FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own google calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can delete their own google calendar tokens"
  ON google_calendar_tokens FOR DELETE
  USING (user_id = auth.uid());

-- 6. Trigger para updated_at
DROP TRIGGER IF EXISTS update_google_calendar_tokens_updated_at ON google_calendar_tokens;
CREATE TRIGGER update_google_calendar_tokens_updated_at
  BEFORE UPDATE ON google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Adicionar company_id na tabela calendar_sync se não existir
ALTER TABLE calendar_sync
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 8. Criar índice para company_id em calendar_sync
CREATE INDEX IF NOT EXISTS idx_calendar_sync_company ON calendar_sync(company_id);

-- 9. Atualizar RLS policies de calendar_sync para incluir company_id
DROP POLICY IF EXISTS "Users can view their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can view their own calendar sync"
  ON calendar_sync FOR SELECT
  USING (
    user_id = auth.uid() AND
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can insert their own calendar sync"
  ON calendar_sync FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can update their own calendar sync"
  ON calendar_sync FOR UPDATE
  USING (
    user_id = auth.uid() AND
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own calendar sync" ON calendar_sync;
CREATE POLICY "Users can delete their own calendar sync"
  ON calendar_sync FOR DELETE
  USING (
    user_id = auth.uid() AND
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- 10. Comentário sobre campos antigos na tabela profiles
COMMENT ON COLUMN profiles.google_calendar_token IS 'DEPRECATED: Use google_calendar_tokens table instead';
COMMENT ON COLUMN profiles.google_calendar_connected IS 'DEPRECATED: Use google_calendar_tokens table instead';
COMMENT ON COLUMN profiles.google_calendar_refresh_token IS 'DEPRECATED: Use google_calendar_tokens table instead';
COMMENT ON COLUMN profiles.google_calendar_email IS 'DEPRECATED: Use google_calendar_tokens table instead';
