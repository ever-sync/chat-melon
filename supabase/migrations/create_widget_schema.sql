-- Migration: Widget Settings & Visitors
-- Description: Tables for embeddable chat widget configuration

-- Widget settings per company
CREATE TABLE IF NOT EXISTS widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Status
  enabled BOOLEAN DEFAULT true,

  -- Appearance
  primary_color VARCHAR(7) DEFAULT '#22C55E',
  secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
  position VARCHAR(20) DEFAULT 'bottom-right', -- bottom-right, bottom-left
  button_size VARCHAR(20) DEFAULT 'medium', -- small, medium, large
  button_icon VARCHAR(50) DEFAULT 'chat', -- chat, message, support
  border_radius INTEGER DEFAULT 16,

  -- Branding
  show_branding BOOLEAN DEFAULT true,
  logo_url TEXT,
  company_name VARCHAR(255),

  -- Texts
  greeting_title VARCHAR(255) DEFAULT 'Olá! 👋',
  greeting_message TEXT DEFAULT 'Como posso ajudar você hoje?',
  offline_message TEXT DEFAULT 'Estamos offline no momento. Deixe sua mensagem e responderemos em breve.',
  input_placeholder VARCHAR(255) DEFAULT 'Digite sua mensagem...',

  -- Pre-chat form
  require_name BOOLEAN DEFAULT true,
  require_email BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT false,
  custom_fields JSONB DEFAULT '[]',

  -- Behavior
  auto_open_delay INTEGER, -- ms to auto-open, null = never
  show_agent_photo BOOLEAN DEFAULT true,
  show_agent_name BOOLEAN DEFAULT true,
  play_sound BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,

  -- Business hours
  business_hours_only BOOLEAN DEFAULT false,
  business_hours JSONB DEFAULT '{"monday":{"start":"09:00","end":"18:00"},"tuesday":{"start":"09:00","end":"18:00"},"wednesday":{"start":"09:00","end":"18:00"},"thursday":{"start":"09:00","end":"18:00"},"friday":{"start":"09:00","end":"18:00"}}',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',

  -- Domains
  allowed_domains TEXT[] DEFAULT '{}', -- Empty = all domains allowed

  -- Triggers
  triggers JSONB DEFAULT '[]', -- [{type: 'time', value: 5000}, {type: 'scroll', value: 50}]

  -- Analytics
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget visitors (anonymous users who interact with widget)
CREATE TABLE IF NOT EXISTS widget_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Identification
  session_id VARCHAR(100) NOT NULL,
  fingerprint VARCHAR(255),

  -- Collected info
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Custom fields from pre-chat form
  user_agent TEXT,
  ip_address VARCHAR(45),
  country VARCHAR(2),
  city VARCHAR(100),
  referrer TEXT,
  landing_page TEXT,

  -- Tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  page_views INTEGER DEFAULT 1,
  total_messages INTEGER DEFAULT 0,

  -- Contact link (if converted to contact)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, session_id)
);

-- Widget conversations (separate from WhatsApp conversations)
CREATE TABLE IF NOT EXISTS widget_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  visitor_id UUID REFERENCES widget_visitors(id) ON DELETE CASCADE NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, resolved, closed

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  queue_id UUID,

  -- Metadata
  subject VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  rating INTEGER, -- 1-5 after conversation ends
  feedback TEXT,

  -- Timestamps
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget messages
CREATE TABLE IF NOT EXISTS widget_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES widget_conversations(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Sender
  sender_type VARCHAR(20) NOT NULL, -- visitor, agent, bot
  sender_id UUID, -- visitor_id or profile_id

  -- Content
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, file
  media_url TEXT,
  media_type VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read

  -- AI
  is_from_ai BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),

  -- Timestamps
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_widget_visitors_company ON widget_visitors(company_id);
CREATE INDEX IF NOT EXISTS idx_widget_visitors_session ON widget_visitors(company_id, session_id);
CREATE INDEX IF NOT EXISTS idx_widget_visitors_email ON widget_visitors(company_id, email);
CREATE INDEX IF NOT EXISTS idx_widget_conversations_company ON widget_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_widget_conversations_visitor ON widget_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_widget_conversations_status ON widget_conversations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_widget_messages_conversation ON widget_messages(conversation_id);

-- RLS Policies
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_messages ENABLE ROW LEVEL SECURITY;

-- Helper function for RLS
-- (Function likely exists, we just ensure it returns UUID. If it exists with _user_id, we match that).
CREATE OR REPLACE FUNCTION get_user_company(_user_id UUID)
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = _user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Widget settings policies
-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Users can view widget settings in their company" ON widget_settings;
CREATE POLICY "Users can view widget settings in their company" ON widget_settings
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage widget settings" ON widget_settings;
CREATE POLICY "Admins can manage widget settings" ON widget_settings
  FOR ALL USING (
    company_id = get_user_company(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND company_id = widget_settings.company_id 
      AND role IN ('admin', 'manager')
    )
  );

-- Widget visitors policies (also need service role access for widget API)
DROP POLICY IF EXISTS "Users can view visitors in their company" ON widget_visitors;
CREATE POLICY "Users can view visitors in their company" ON widget_visitors
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage visitors" ON widget_visitors;
CREATE POLICY "Service role can manage visitors" ON widget_visitors
  FOR ALL USING (auth.role() = 'service_role');

-- Widget conversations policies
DROP POLICY IF EXISTS "Users can view widget conversations in their company" ON widget_conversations;
CREATE POLICY "Users can view widget conversations in their company" ON widget_conversations
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update widget conversations in their company" ON widget_conversations;
CREATE POLICY "Users can update widget conversations in their company" ON widget_conversations
  FOR UPDATE USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage widget conversations" ON widget_conversations;
CREATE POLICY "Service role can manage widget conversations" ON widget_conversations
  FOR ALL USING (auth.role() = 'service_role');

-- Widget messages policies
DROP POLICY IF EXISTS "Users can view widget messages in their company" ON widget_messages;
CREATE POLICY "Users can view widget messages in their company" ON widget_messages
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can create widget messages in their company" ON widget_messages;
CREATE POLICY "Users can create widget messages in their company" ON widget_messages
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage widget messages" ON widget_messages;
CREATE POLICY "Service role can manage widget messages" ON widget_messages
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_widget_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_widget_settings_updated_at ON widget_settings;
CREATE TRIGGER trigger_widget_settings_updated_at
  BEFORE UPDATE ON widget_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_settings_updated_at();
