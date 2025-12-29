-- Tabela para armazenar credenciais OAuth do Gmail
CREATE TABLE IF NOT EXISTS gmail_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE,

  -- Email info
  email_address TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: um email por empresa
  UNIQUE(company_id, email_address)
);

-- Index para busca rápida
CREATE INDEX idx_gmail_credentials_company ON gmail_credentials(company_id);
CREATE INDEX idx_gmail_credentials_active ON gmail_credentials(company_id, is_active);

-- RLS
ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their company's gmail credentials"
  ON gmail_credentials FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert gmail credentials for their company"
  ON gmail_credentials FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their company's gmail credentials"
  ON gmail_credentials FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's gmail credentials"
  ON gmail_credentials FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_gmail_credentials_updated_at
  BEFORE UPDATE ON gmail_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE gmail_credentials IS 'Armazena credenciais OAuth2 do Gmail para integração de email';
COMMENT ON COLUMN gmail_credentials.access_token IS 'Token de acesso temporário da API do Gmail';
COMMENT ON COLUMN gmail_credentials.refresh_token IS 'Token para renovar o access_token';
COMMENT ON COLUMN gmail_credentials.token_expiry IS 'Data/hora de expiração do access_token';
