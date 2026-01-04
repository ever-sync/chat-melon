-- =====================================================
-- Channel Settings & Metadata por Canal
-- Permite configurações de Bot/IA/Regras por canal
-- =====================================================

-- Tabela principal de configurações por canal
CREATE TABLE IF NOT EXISTS channel_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Configurações de Bot
    bot_enabled BOOLEAN DEFAULT false,
    bot_id UUID, -- Referência ao chatbot (se existir)
    bot_welcome_message TEXT,
    bot_fallback_message TEXT DEFAULT 'Desculpe, não entendi. Um atendente irá ajudá-lo em breve.',
    bot_transfer_to_human_keywords TEXT[] DEFAULT ARRAY['atendente', 'humano', 'pessoa', 'falar com alguém'],

    -- Configurações de IA
    ai_enabled BOOLEAN DEFAULT false,
    ai_model TEXT DEFAULT 'gpt-4o-mini',
    ai_temperature DECIMAL(2,1) DEFAULT 0.7,
    ai_max_tokens INTEGER DEFAULT 500,
    ai_system_prompt TEXT,
    ai_auto_respond BOOLEAN DEFAULT false,
    ai_suggest_responses BOOLEAN DEFAULT true,
    ai_auto_categorize BOOLEAN DEFAULT true,
    ai_sentiment_analysis BOOLEAN DEFAULT true,

    -- Horário de Atendimento
    business_hours_enabled BOOLEAN DEFAULT false,
    business_hours JSONB DEFAULT '{
        "monday": {"start": "09:00", "end": "18:00", "enabled": true},
        "tuesday": {"start": "09:00", "end": "18:00", "enabled": true},
        "wednesday": {"start": "09:00", "end": "18:00", "enabled": true},
        "thursday": {"start": "09:00", "end": "18:00", "enabled": true},
        "friday": {"start": "09:00", "end": "18:00", "enabled": true},
        "saturday": {"start": "09:00", "end": "13:00", "enabled": false},
        "sunday": {"start": null, "end": null, "enabled": false}
    }'::jsonb,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    outside_hours_message TEXT DEFAULT 'Estamos fora do horário de atendimento. Retornaremos em breve!',

    -- Mensagens Automáticas
    welcome_message TEXT,
    welcome_message_enabled BOOLEAN DEFAULT false,
    away_message TEXT,
    away_message_enabled BOOLEAN DEFAULT false,

    -- Regras de Roteamento
    auto_assign_enabled BOOLEAN DEFAULT false,
    auto_assign_method TEXT DEFAULT 'round_robin' CHECK (auto_assign_method IN ('round_robin', 'least_busy', 'random', 'specific_user')),
    auto_assign_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    auto_assign_sector_id UUID,

    -- SLA e Prioridade
    default_priority TEXT DEFAULT 'normal' CHECK (default_priority IN ('low', 'normal', 'high', 'urgent')),
    sla_first_response_minutes INTEGER DEFAULT 30,
    sla_resolution_minutes INTEGER DEFAULT 480,

    -- Configurações específicas do canal
    channel_specific_settings JSONB DEFAULT '{}'::jsonb,

    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),

    UNIQUE(channel_id)
);

-- Índices para channel_settings
CREATE INDEX IF NOT EXISTS idx_channel_settings_channel ON channel_settings(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_settings_company ON channel_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_channel_settings_bot_enabled ON channel_settings(bot_enabled) WHERE bot_enabled = true;
CREATE INDEX IF NOT EXISTS idx_channel_settings_ai_enabled ON channel_settings(ai_enabled) WHERE ai_enabled = true;

-- Metadata específico do Instagram
CREATE TABLE IF NOT EXISTS instagram_conversation_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Dados específicos do Instagram
    ig_thread_id TEXT,
    ig_user_id TEXT,
    ig_username TEXT,
    ig_profile_pic TEXT,
    ig_is_verified BOOLEAN DEFAULT false,
    ig_follower_count INTEGER,
    ig_is_business BOOLEAN DEFAULT false,

    -- Story replies
    last_story_reply_id TEXT,
    story_reply_count INTEGER DEFAULT 0,

    -- Reels/Posts interactions
    last_post_interaction_id TEXT,
    post_interaction_count INTEGER DEFAULT 0,

    -- Engajamento
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(conversation_id)
);

-- Metadata específico do Facebook Messenger
CREATE TABLE IF NOT EXISTS facebook_conversation_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Dados específicos do Facebook
    fb_user_id TEXT,
    fb_page_id TEXT,
    fb_thread_id TEXT,
    fb_profile_pic TEXT,
    fb_locale TEXT,
    fb_timezone INTEGER,
    fb_gender TEXT,

    -- Interações
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,

    -- Referral (de anúncios, posts, etc)
    referral_source TEXT,
    referral_type TEXT,
    referral_ad_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(conversation_id)
);

-- Metadata específico do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversation_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Dados específicos do WhatsApp
    wa_id TEXT, -- WhatsApp ID
    wa_phone TEXT,
    wa_profile_name TEXT,
    wa_profile_pic TEXT,
    wa_is_business BOOLEAN DEFAULT false,
    wa_business_name TEXT,
    wa_business_description TEXT,

    -- Status do contato
    wa_is_contact BOOLEAN DEFAULT false,
    wa_is_blocked BOOLEAN DEFAULT false,

    -- Templates
    last_template_sent TEXT,
    last_template_sent_at TIMESTAMPTZ,
    template_messages_sent INTEGER DEFAULT 0,

    -- Sessão de conversa (24h window)
    session_started_at TIMESTAMPTZ,
    session_expires_at TIMESTAMPTZ,
    is_session_active BOOLEAN DEFAULT false,

    -- Estatísticas
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    media_received INTEGER DEFAULT 0,
    media_sent INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(conversation_id)
);

-- Metadata específico do WebChat/Widget
CREATE TABLE IF NOT EXISTS webchat_conversation_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Dados do visitante
    visitor_id TEXT,
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,

    -- Dados de navegação
    current_page_url TEXT,
    current_page_title TEXT,
    referrer_url TEXT,
    landing_page TEXT,

    -- Device info
    user_agent TEXT,
    device_type TEXT, -- desktop, mobile, tablet
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,

    -- Geolocalização
    ip_address TEXT,
    country TEXT,
    city TEXT,
    region TEXT,

    -- UTM tracking
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,

    -- Sessão
    session_id TEXT,
    session_started_at TIMESTAMPTZ,
    pages_visited INTEGER DEFAULT 0,
    time_on_site_seconds INTEGER DEFAULT 0,

    -- Pré-chat form data
    prechat_data JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(conversation_id)
);

-- Índices para metadatas
CREATE INDEX IF NOT EXISTS idx_ig_metadata_conversation ON instagram_conversation_metadata(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ig_metadata_username ON instagram_conversation_metadata(ig_username);

CREATE INDEX IF NOT EXISTS idx_fb_metadata_conversation ON facebook_conversation_metadata(conversation_id);
CREATE INDEX IF NOT EXISTS idx_fb_metadata_user ON facebook_conversation_metadata(fb_user_id);

CREATE INDEX IF NOT EXISTS idx_wa_metadata_conversation ON whatsapp_conversation_metadata(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_metadata_phone ON whatsapp_conversation_metadata(wa_phone);
CREATE INDEX IF NOT EXISTS idx_wa_metadata_session ON whatsapp_conversation_metadata(is_session_active) WHERE is_session_active = true;

CREATE INDEX IF NOT EXISTS idx_webchat_metadata_conversation ON webchat_conversation_metadata(conversation_id);
CREATE INDEX IF NOT EXISTS idx_webchat_metadata_visitor ON webchat_conversation_metadata(visitor_id);
CREATE INDEX IF NOT EXISTS idx_webchat_metadata_email ON webchat_conversation_metadata(visitor_email);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_channel_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_channel_settings_updated ON channel_settings;
CREATE TRIGGER trigger_channel_settings_updated
    BEFORE UPDATE ON channel_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_settings_timestamp();

-- Triggers para metadatas
DROP TRIGGER IF EXISTS trigger_ig_metadata_updated ON instagram_conversation_metadata;
CREATE TRIGGER trigger_ig_metadata_updated
    BEFORE UPDATE ON instagram_conversation_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_settings_timestamp();

DROP TRIGGER IF EXISTS trigger_fb_metadata_updated ON facebook_conversation_metadata;
CREATE TRIGGER trigger_fb_metadata_updated
    BEFORE UPDATE ON facebook_conversation_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_settings_timestamp();

DROP TRIGGER IF EXISTS trigger_wa_metadata_updated ON whatsapp_conversation_metadata;
CREATE TRIGGER trigger_wa_metadata_updated
    BEFORE UPDATE ON whatsapp_conversation_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_settings_timestamp();

DROP TRIGGER IF EXISTS trigger_webchat_metadata_updated ON webchat_conversation_metadata;
CREATE TRIGGER trigger_webchat_metadata_updated
    BEFORE UPDATE ON webchat_conversation_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_settings_timestamp();

-- RLS Policies
ALTER TABLE channel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_conversation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_conversation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE webchat_conversation_metadata ENABLE ROW LEVEL SECURITY;

-- Policies para channel_settings
CREATE POLICY "Users can view channel settings of their company"
    ON channel_settings FOR SELECT
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert channel settings for their company"
    ON channel_settings FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update channel settings of their company"
    ON channel_settings FOR UPDATE
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete channel settings of their company"
    ON channel_settings FOR DELETE
    USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies para instagram_conversation_metadata (via conversation)
CREATE POLICY "Users can view instagram metadata of their conversations"
    ON instagram_conversation_metadata FOR SELECT
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can manage instagram metadata"
    ON instagram_conversation_metadata FOR ALL
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

-- Policies para facebook_conversation_metadata
CREATE POLICY "Users can view facebook metadata of their conversations"
    ON facebook_conversation_metadata FOR SELECT
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can manage facebook metadata"
    ON facebook_conversation_metadata FOR ALL
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

-- Policies para whatsapp_conversation_metadata
CREATE POLICY "Users can view whatsapp metadata of their conversations"
    ON whatsapp_conversation_metadata FOR SELECT
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can manage whatsapp metadata"
    ON whatsapp_conversation_metadata FOR ALL
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

-- Policies para webchat_conversation_metadata
CREATE POLICY "Users can view webchat metadata of their conversations"
    ON webchat_conversation_metadata FOR SELECT
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can manage webchat metadata"
    ON webchat_conversation_metadata FOR ALL
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN profiles p ON p.company_id = c.company_id
        WHERE p.id = auth.uid()
    ));

-- Função para obter configurações do canal
CREATE OR REPLACE FUNCTION get_channel_settings(p_channel_id UUID)
RETURNS channel_settings AS $$
DECLARE
    v_settings channel_settings;
BEGIN
    SELECT * INTO v_settings
    FROM channel_settings
    WHERE channel_id = p_channel_id;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar configurações padrão ao criar canal
CREATE OR REPLACE FUNCTION create_default_channel_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO channel_settings (channel_id, company_id)
    VALUES (NEW.id, NEW.company_id)
    ON CONFLICT (channel_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_channel_settings ON channels;
CREATE TRIGGER trigger_create_channel_settings
    AFTER INSERT ON channels
    FOR EACH ROW
    EXECUTE FUNCTION create_default_channel_settings();

-- Criar configurações para canais existentes
INSERT INTO channel_settings (channel_id, company_id)
SELECT id, company_id FROM channels
ON CONFLICT (channel_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE channel_settings IS 'Configurações de atendimento por canal (Bot, IA, horários, roteamento)';
COMMENT ON TABLE instagram_conversation_metadata IS 'Metadados específicos de conversas do Instagram';
COMMENT ON TABLE facebook_conversation_metadata IS 'Metadados específicos de conversas do Facebook Messenger';
COMMENT ON TABLE whatsapp_conversation_metadata IS 'Metadados específicos de conversas do WhatsApp';
COMMENT ON TABLE webchat_conversation_metadata IS 'Metadados específicos de conversas do WebChat/Widget';
