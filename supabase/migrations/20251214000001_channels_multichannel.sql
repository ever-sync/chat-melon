-- =====================================================
-- FASE 2: Estrutura de Canais Multi-Canal
-- =====================================================

-- Tipo enum para canais
DO $$ BEGIN
  CREATE TYPE channel_type AS ENUM ('whatsapp', 'instagram', 'messenger', 'telegram', 'widget', 'email');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela unificada de canais
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type channel_type NOT NULL,
  name VARCHAR(100) NOT NULL,

  -- Credenciais (criptografadas via Vault ou env)
  credentials JSONB NOT NULL DEFAULT '{}',
  -- WhatsApp: {instance_name, api_key}
  -- Instagram: {page_id, instagram_account_id, access_token}
  -- Messenger: {page_id, page_access_token}
  -- Telegram: {bot_token, bot_username}
  -- Widget: {company_id}
  -- Email: {smtp_host, smtp_port, smtp_user, imap_host}

  -- Status
  status VARCHAR(20) DEFAULT 'disconnected',
  -- disconnected, connecting, connected, error, rate_limited
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,

  -- Configurações específicas do canal
  settings JSONB DEFAULT '{}',
  -- Instagram: {ice_breakers: [], quick_replies: []}
  -- Messenger: {persistent_menu: [], get_started_payload: ''}

  -- Métricas
  total_conversations INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,

  -- Metadata
  external_id VARCHAR(255), -- ID na plataforma externa (page_id, bot_id, etc.)
  webhook_url TEXT,
  webhook_secret VARCHAR(64),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que cada empresa só tenha um canal do mesmo tipo com mesmo external_id
  UNIQUE(company_id, type, external_id)
);

-- Adicionar colunas de canal nas conversas
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id),
  ADD COLUMN IF NOT EXISTS channel_type channel_type DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS external_conversation_id VARCHAR(255);

-- Índices para busca por canal
CREATE INDEX IF NOT EXISTS idx_channels_company ON channels(company_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(company_id, type);
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status) WHERE status != 'disconnected';
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_external ON conversations(channel_type, external_conversation_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_channels_updated_at ON channels;
CREATE TRIGGER trigger_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_channels_updated_at();

-- =====================================================
-- Instagram Integration Tables
-- =====================================================

-- Tabela para armazenar mensagens do Instagram (ice breakers, story mentions)
CREATE TABLE IF NOT EXISTS instagram_messages_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,

  -- Tipo de mensagem do Instagram
  instagram_message_type VARCHAR(50), -- text, image, video, audio, story_mention, story_reply, reaction

  -- Dados específicos do Instagram
  story_id VARCHAR(100), -- Se for story mention/reply
  story_url TEXT,
  reaction_emoji VARCHAR(10), -- Se for reaction
  reply_to_message_id VARCHAR(100), -- Se for resposta a mensagem

  -- Metadata adicional
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Facebook Messenger Integration Tables
-- =====================================================

-- Tabela para templates do Messenger (generic, button, receipt)
CREATE TABLE IF NOT EXISTS messenger_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- generic, button, receipt, media

  -- Template payload (formato Messenger)
  payload JSONB NOT NULL,

  -- Métricas
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Telegram Integration Tables
-- =====================================================

-- Comandos do bot Telegram
CREATE TABLE IF NOT EXISTS telegram_bot_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

  command VARCHAR(50) NOT NULL, -- sem a barra, ex: "start", "help"
  description VARCHAR(255) NOT NULL,
  response TEXT, -- Resposta automática
  action VARCHAR(50), -- start_conversation, show_menu, handoff, etc.

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(channel_id, command)
);

-- =====================================================
-- Channel Health Monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS channel_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL, -- healthy, degraded, down
  response_time_ms INTEGER,
  error_message TEXT,

  -- Detalhes do check
  check_type VARCHAR(50), -- api_call, webhook_test, auth_refresh
  details JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas de health
CREATE INDEX IF NOT EXISTS idx_channel_health_logs_channel ON channel_health_logs(channel_id, created_at DESC);

-- Limpar logs antigos (manter últimos 7 dias)
CREATE OR REPLACE FUNCTION cleanup_channel_health_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM channel_health_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_messages_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_health_logs ENABLE ROW LEVEL SECURITY;

-- Channels policies
DROP POLICY IF EXISTS "Users can view channels from their company" ON channels;
CREATE POLICY "Users can view channels from their company"
  ON channels FOR SELECT
  USING (company_id = get_user_company());

DROP POLICY IF EXISTS "Users can manage channels from their company" ON channels;
CREATE POLICY "Users can manage channels from their company"
  ON channels FOR ALL
  USING (company_id = get_user_company());

-- Instagram metadata policies
DROP POLICY IF EXISTS "Users can view instagram metadata from their conversations" ON instagram_messages_metadata;
CREATE POLICY "Users can view instagram metadata from their conversations"
  ON instagram_messages_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = instagram_messages_metadata.message_id
      AND c.company_id = get_user_company()
    )
  );

-- Messenger templates policies
DROP POLICY IF EXISTS "Users can manage messenger templates from their company" ON messenger_templates;
CREATE POLICY "Users can manage messenger templates from their company"
  ON messenger_templates FOR ALL
  USING (company_id = get_user_company());

-- Telegram commands policies
DROP POLICY IF EXISTS "Users can manage telegram commands from their channels" ON telegram_bot_commands;
CREATE POLICY "Users can manage telegram commands from their channels"
  ON telegram_bot_commands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = telegram_bot_commands.channel_id
      AND c.company_id = get_user_company()
    )
  );

-- Channel health policies
DROP POLICY IF EXISTS "Users can view health logs from their channels" ON channel_health_logs;
CREATE POLICY "Users can view health logs from their channels"
  ON channel_health_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = channel_health_logs.channel_id
      AND c.company_id = get_user_company()
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Função para obter canal WhatsApp padrão de uma empresa
CREATE OR REPLACE FUNCTION get_default_whatsapp_channel(p_company_id UUID)
RETURNS UUID AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  SELECT id INTO v_channel_id
  FROM channels
  WHERE company_id = p_company_id
    AND type = 'whatsapp'
    AND status = 'connected'
  ORDER BY created_at
  LIMIT 1;

  RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar contadores do canal
CREATE OR REPLACE FUNCTION increment_channel_stats(
  p_channel_id UUID,
  p_stat VARCHAR(50),
  p_amount INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  CASE p_stat
    WHEN 'conversations' THEN
      UPDATE channels SET total_conversations = total_conversations + p_amount WHERE id = p_channel_id;
    WHEN 'messages_sent' THEN
      UPDATE channels SET total_messages_sent = total_messages_sent + p_amount WHERE id = p_channel_id;
    WHEN 'messages_received' THEN
      UPDATE channels SET total_messages_received = total_messages_received + p_amount WHERE id = p_channel_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;
