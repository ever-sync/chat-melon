-- =====================================================
-- FASE 5: Enterprise Features
-- =====================================================

-- =====================================================
-- 5.2 SSO (SAML/OAuth)
-- =====================================================

-- Configurações SSO por empresa
CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tipo de SSO
  provider VARCHAR(50) NOT NULL, -- saml, google, microsoft, okta, custom_oauth
  
  -- Configurações SAML
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_certificate TEXT,
  saml_name_id_format VARCHAR(100) DEFAULT 'email',
  
  -- Configurações OAuth
  oauth_client_id TEXT,
  oauth_client_secret TEXT, -- Criptografado
  oauth_authorize_url TEXT,
  oauth_token_url TEXT,
  oauth_userinfo_url TEXT,
  oauth_scopes TEXT[],
  
  -- Mapeamento de atributos
  attribute_mapping JSONB DEFAULT '{"email": "email", "name": "name"}',
  
  -- Políticas
  enforce_sso BOOLEAN DEFAULT false, -- Se true, usuários só podem logar via SSO
  auto_provision_users BOOLEAN DEFAULT true,
  default_role VARCHAR(50) DEFAULT 'member',
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, provider)
);

-- =====================================================
-- 5.3 Audit Logs Completos
-- =====================================================

-- Audit logs detalhados
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Quem fez a ação
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_ip INET,
  user_agent TEXT,
  
  -- O que foi feito
  action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout, export, etc.
  resource_type VARCHAR(100) NOT NULL, -- contact, deal, conversation, settings, etc.
  resource_id UUID,
  resource_name TEXT, -- Para facilitar busca
  
  -- Detalhes da mudança
  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- Apenas os campos alterados
  
  -- Contexto adicional
  metadata JSONB DEFAULT '{}',
  -- Exemplo: {"request_id": "...", "source": "web", "endpoint": "/api/contacts"}
  
  -- Classificação
  severity VARCHAR(20) DEFAULT 'info', -- debug, info, warning, critical
  category VARCHAR(50), -- authentication, data_access, configuration, billing
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para audit logs (performance é crítica)
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('warning', 'critical');

-- Particionamento por data (para grandes volumes)
-- CREATE TABLE IF NOT EXISTS audit_logs_2024 PARTITION OF audit_logs FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- =====================================================
-- 5.4 2FA Obrigatório
-- =====================================================

-- Configurações de 2FA por empresa
CREATE TABLE IF NOT EXISTS two_factor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  
  -- Políticas
  require_2fa BOOLEAN DEFAULT false,
  require_2fa_for_roles TEXT[] DEFAULT ARRAY['admin'], -- Roles que precisam de 2FA
  grace_period_days INTEGER DEFAULT 7, -- Dias para configurar após ser obrigatório
  
  -- Métodos permitidos
  allowed_methods TEXT[] DEFAULT ARRAY['totp', 'sms'], -- totp, sms, email, webauthn
  
  -- Configurações
  totp_issuer VARCHAR(100), -- Nome que aparece no app autenticador
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status 2FA por usuário
CREATE TABLE IF NOT EXISTS user_2fa_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Métodos configurados
  totp_enabled BOOLEAN DEFAULT false,
  totp_secret TEXT, -- Criptografado
  totp_backup_codes TEXT[], -- Criptografados
  
  sms_enabled BOOLEAN DEFAULT false,
  sms_phone VARCHAR(20),
  
  email_enabled BOOLEAN DEFAULT false,
  
  webauthn_enabled BOOLEAN DEFAULT false,
  webauthn_credentials JSONB DEFAULT '[]',
  
  -- Status
  is_2fa_enabled BOOLEAN GENERATED ALWAYS AS (totp_enabled OR sms_enabled OR email_enabled OR webauthn_enabled) STORED,
  last_verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recovery codes usados (para não reutilizar)
CREATE TABLE IF NOT EXISTS used_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL, -- SHA256 do código
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, code_hash)
);

-- =====================================================
-- Funções auxiliares
-- =====================================================

-- Função para criar audit log
CREATE OR REPLACE FUNCTION create_audit_log(
  p_action VARCHAR(100),
  p_resource_type VARCHAR(100),
  p_resource_id UUID DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Obter company do usuário
  SELECT company_id INTO v_company_id
  FROM company_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Obter email do usuário
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Criar log
  INSERT INTO audit_logs (
    company_id, user_id, user_email, action,
    resource_type, resource_id, resource_name,
    old_values, new_values, metadata
  ) VALUES (
    v_company_id, auth.uid(), v_user_email, p_action,
    p_resource_type, p_resource_id, p_resource_name,
    p_old_values, p_new_values, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_status ENABLE ROW LEVEL SECURITY;

-- SSO - Apenas admins podem gerenciar
DROP POLICY IF EXISTS "Admins can manage SSO configurations" ON sso_configurations;
CREATE POLICY "Admins can manage SSO configurations" ON sso_configurations
  FOR ALL USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
    )
  );

-- Audit Logs - Todos da empresa podem visualizar
DROP POLICY IF EXISTS "Users can view audit logs from their company" ON audit_logs;
CREATE POLICY "Users can view audit logs from their company" ON audit_logs
  FOR SELECT USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- 2FA Settings - Apenas admins
DROP POLICY IF EXISTS "Admins can manage 2FA settings" ON two_factor_settings;
CREATE POLICY "Admins can manage 2FA settings" ON two_factor_settings
  FOR ALL USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm
      WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
    )
  );

-- User 2FA Status - Usuário pode ver/editar o próprio
DROP POLICY IF EXISTS "Users can manage their own 2FA status" ON user_2fa_status;
CREATE POLICY "Users can manage their own 2FA status" ON user_2fa_status
  FOR ALL USING (user_id = auth.uid());