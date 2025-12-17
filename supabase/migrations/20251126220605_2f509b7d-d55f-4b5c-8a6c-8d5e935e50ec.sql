-- ============================================
-- SUPER ADMIN SYSTEM
-- ============================================

-- Tabela de administradores da plataforma
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Tabela de features controláveis da plataforma
CREATE TABLE IF NOT EXISTS platform_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_global_enabled BOOLEAN DEFAULT true,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela que liga planos a features
CREATE TABLE IF NOT EXISTS plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES platform_features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, feature_id)
);

-- Função para verificar se usuário é platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM platform_admins
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- RLS Policies para platform_admins
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view all admins" ON platform_admins;
CREATE POLICY "Platform admins can view all admins"
  ON platform_admins
  FOR SELECT
  USING (is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins can insert new admins" ON platform_admins;
CREATE POLICY "Platform admins can insert new admins"
  ON platform_admins
  FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins can update admins" ON platform_admins;
CREATE POLICY "Platform admins can update admins"
  ON platform_admins
  FOR UPDATE
  USING (is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins can delete admins" ON platform_admins;
CREATE POLICY "Platform admins can delete admins"
  ON platform_admins
  FOR DELETE
  USING (is_platform_admin(auth.uid()));

-- RLS Policies para platform_features
ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view features" ON platform_features;
CREATE POLICY "Anyone can view features"
  ON platform_features
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Platform admins can manage features" ON platform_features;
CREATE POLICY "Platform admins can manage features"
  ON platform_features
  FOR ALL
  USING (is_platform_admin(auth.uid()));

-- RLS Policies para plan_features
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan features" ON plan_features;
CREATE POLICY "Anyone can view plan features"
  ON plan_features
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Platform admins can manage plan features" ON plan_features;
CREATE POLICY "Platform admins can manage plan features"
  ON plan_features
  FOR ALL
  USING (is_platform_admin(auth.uid()));

-- Seed: Features padrão da plataforma
INSERT INTO platform_features (feature_key, name, description, category, icon, order_index) VALUES
('proposals', 'Propostas', 'Sistema de propostas comerciais', 'crm', 'FileBarChart', 1),
('gamification', 'Gamificação', 'Sistema de metas e conquistas', 'engagement', 'Trophy', 2),
('campaigns', 'Campanhas', 'Envio de mensagens em massa', 'marketing', 'Send', 3),
('automation', 'Automações', 'Playbooks e fluxos automatizados', 'automation', 'Zap', 4),
('segments', 'Segmentos', 'Segmentação de contatos', 'marketing', 'Filter', 5),
('duplicates', 'Duplicados', 'Detecção e merge de duplicados', 'data', 'GitMerge', 6),
('groups', 'Grupos WhatsApp', 'Gerenciamento de grupos', 'chat', 'UsersRound', 7),
('ai_assistant', 'Assistente IA', 'Sugestões e análise com IA', 'ai', 'Sparkles', 8),
('reports_advanced', 'Relatórios Avançados', 'Analytics e insights completos', 'analytics', 'BarChart3', 9),
('products', 'Produtos', 'Catálogo de produtos', 'crm', 'Package', 10);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_platform_features_updated_at ON platform_features;
CREATE TRIGGER update_platform_features_updated_at
  BEFORE UPDATE ON platform_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();