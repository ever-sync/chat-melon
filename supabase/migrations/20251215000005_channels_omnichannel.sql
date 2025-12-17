-- =====================================================
-- FASE 2: Canais de Comunicação (Instagram, Messenger)
-- =====================================================

-- Tabela de canais
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tipo do canal
  type VARCHAR(50) NOT NULL, -- whatsapp, instagram, messenger, email, webchat
  name VARCHAR(100) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'disconnected', -- connected, disconnected, error
  
  -- Credenciais (criptografadas em produção)
  credentials JSONB DEFAULT '{}',
  -- WhatsApp Evolution: { "instance_name": "...", "api_key": "..." }
  -- Instagram: { "instagram_id": "...", "access_token": "...", "page_id": "..." }
  -- Messenger: { "page_id": "...", "access_token": "...", "page_name": "..." }
  
  -- Configurações do canal
  settings JSONB DEFAULT '{}',
  -- { "auto_reply": true, "welcome_message": "...", "business_hours": {...} }
  
  -- Webhook info
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- Métricas
  total_conversations INTEGER DEFAULT 0,
  total_messages_in INTEGER DEFAULT 0,
  total_messages_out INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  -- Meta específico
  meta_app_id TEXT,
  meta_app_secret TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, type, name)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_channels_company ON channels(company_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(company_id, type);
CREATE INDEX IF NOT EXISTS idx_channels_active ON channels(company_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage channels from their company" ON channels;

DROP POLICY IF EXISTS "Users can manage channels from their company" ON channels;
CREATE POLICY "Users can manage channels from their company" ON channels
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_channels_updated_at ON channels;
CREATE TRIGGER trigger_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar channel_id na tabela conversations se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN channel_id UUID REFERENCES channels(id);
  END IF;
END
$$;

-- Adicionar channel_type nas conversations se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'channel_type'
  ) THEN
    ALTER TABLE conversations ADD COLUMN channel_type VARCHAR(50) DEFAULT 'whatsapp';
  END IF;
END
$$;

-- Adicionar profile_picture_url nos contacts se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE contacts ADD COLUMN profile_picture_url TEXT;
  END IF;
END
$$;

-- Adicionar external_id nos contacts se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE contacts ADD COLUMN external_id TEXT;
  END IF;
END
$$;

-- Adicionar channel_type nos contacts se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'channel_type'
  ) THEN
    ALTER TABLE contacts ADD COLUMN channel_type VARCHAR(50) DEFAULT 'whatsapp';
  END IF;
END
$$;

-- Índices para busca por external_id
CREATE INDEX IF NOT EXISTS idx_contacts_external ON contacts(company_id, external_id, channel_type);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel_id);

-- Feature Flag: Channels
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES 
  ('channels', 'Canais', 'Gestão de canais (Instagram, Messenger, WhatsApp)', 'communication', true, 'MessageCircle', 27)
ON CONFLICT (feature_key) DO NOTHING;
