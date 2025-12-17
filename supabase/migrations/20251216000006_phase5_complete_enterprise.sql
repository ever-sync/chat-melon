-- =====================================================
-- FASE 5: Enterprise Features - Complete Implementation
-- =====================================================

-- =====================================================
-- 5.1 MULTI-TENANT & WHITE LABEL
-- =====================================================

-- Configurações de White Label por empresa
CREATE TABLE IF NOT EXISTS white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

  -- Branding
  brand_name VARCHAR(200),
  brand_logo_url TEXT,
  brand_favicon_url TEXT,
  brand_primary_color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
  brand_secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
  brand_accent_color VARCHAR(7) DEFAULT '#ec4899',

  -- Domínio customizado
  custom_domain VARCHAR(255),
  custom_domain_verified BOOLEAN DEFAULT false,
  custom_domain_verified_at TIMESTAMPTZ,

  -- Email branding
  email_from_name VARCHAR(100),
  email_from_address VARCHAR(255),
  email_reply_to VARCHAR(255),
  email_header_logo_url TEXT,
  email_footer_text TEXT,

  -- Customizações de interface
  custom_css TEXT,
  custom_javascript TEXT,
  hide_powered_by BOOLEAN DEFAULT false, -- Esconder "Powered by MelonChat"

  -- Terms & Privacy
  custom_terms_url TEXT,
  custom_privacy_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de domínios customizados
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  white_label_id UUID REFERENCES white_label_settings(id) ON DELETE CASCADE,

  -- Domínio
  domain VARCHAR(255) NOT NULL UNIQUE,
  subdomain VARCHAR(255), -- Se for subdomínio do sistema

  -- Verificação
  verification_method VARCHAR(20) DEFAULT 'dns', -- dns, http
  verification_token TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- DNS Records necessários
  required_dns_records JSONB DEFAULT '[]',
  -- Exemplo: [
  --   {"type": "CNAME", "name": "@", "value": "app.melonchat.com"},
  --   {"type": "TXT", "name": "_verification", "value": "token123"}
  -- ]

  -- SSL
  ssl_enabled BOOLEAN DEFAULT false,
  ssl_certificate TEXT,
  ssl_certificate_expires_at TIMESTAMPTZ,
  auto_renew_ssl BOOLEAN DEFAULT true,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, failed, expired
  last_check_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5.2 ADVANCED PERMISSIONS & ROLES (RBAC)
-- =====================================================

-- Tabela de permissões granulares
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  key VARCHAR(100) NOT NULL UNIQUE, -- Ex: 'contacts.create', 'deals.delete', 'settings.billing'
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Categorização
  resource VARCHAR(50) NOT NULL, -- contacts, deals, conversations, settings, etc.
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, export, etc.

  -- Metadata
  category VARCHAR(50), -- data_management, configuration, billing, etc.
  is_system BOOLEAN DEFAULT true, -- Permissões do sistema vs customizadas

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles customizados por empresa
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Definição
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Para UI

  -- Tipo
  is_system BOOLEAN DEFAULT false, -- admin, member são system roles
  is_default BOOLEAN DEFAULT false, -- Role padrão para novos usuários

  -- Hierarquia
  parent_role_id UUID REFERENCES custom_roles(id),
  priority INTEGER DEFAULT 0, -- Maior = mais permissões

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, name)
);

-- Permissões atribuídas a roles
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  -- Controle
  granted BOOLEAN DEFAULT true, -- true = concedido, false = explicitamente negado

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role_id, permission_id)
);

-- Roles de usuários (um usuário pode ter múltiplos roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,

  -- Escopo (opcional - para permissões limitadas)
  scope JSONB DEFAULT '{}',
  -- Exemplo: {"queue_ids": ["uuid1", "uuid2"], "team_id": "uuid"}

  -- Temporário
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, company_id, role_id)
);

-- Função para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_company_id UUID,
  p_permission_key VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- Verificar se usuário tem algum role com essa permissão
  SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND ur.company_id = p_company_id
      AND p.key = p_permission_key
      AND rp.granted = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas permissões de um usuário
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_company_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  SELECT jsonb_agg(DISTINCT p.key)
  INTO v_permissions
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = p_user_id
    AND ur.company_id = p_company_id
    AND rp.granted = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

  RETURN COALESCE(v_permissions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5.3 BACKUP & DISASTER RECOVERY
-- =====================================================

-- Configurações de backup por empresa
CREATE TABLE IF NOT EXISTS backup_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

  -- Política de backup
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'daily', -- hourly, daily, weekly
  backup_time TIME DEFAULT '02:00:00', -- Horário do backup
  backup_retention_days INTEGER DEFAULT 30,

  -- O que fazer backup
  include_conversations BOOLEAN DEFAULT true,
  include_contacts BOOLEAN DEFAULT true,
  include_deals BOOLEAN DEFAULT true,
  include_files BOOLEAN DEFAULT true,
  include_settings BOOLEAN DEFAULT true,

  -- Onde armazenar
  storage_provider VARCHAR(50) DEFAULT 's3', -- s3, gcs, azure, local
  storage_config JSONB DEFAULT '{}',
  -- Exemplo: {"bucket": "backups", "region": "us-east-1", "path": "/company-id/"}

  -- Notificações
  notify_on_success BOOLEAN DEFAULT false,
  notify_on_failure BOOLEAN DEFAULT true,
  notification_emails TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de backups
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  backup_config_id UUID REFERENCES backup_configurations(id) ON DELETE SET NULL,

  -- Identificação
  backup_name VARCHAR(255) NOT NULL,
  backup_type VARCHAR(20) DEFAULT 'automatic', -- automatic, manual

  -- Conteúdo
  included_tables TEXT[],
  total_records INTEGER,
  total_size_bytes BIGINT,

  -- Armazenamento
  storage_path TEXT,
  storage_url TEXT, -- URL pré-assinada (expira)
  expires_at TIMESTAMPTZ,

  -- Verificação
  checksum VARCHAR(64), -- SHA256
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, failed
  progress INTEGER DEFAULT 0,
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restore jobs
CREATE TABLE IF NOT EXISTS restore_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  backup_id UUID NOT NULL REFERENCES backup_history(id),
  requested_by UUID REFERENCES profiles(id),

  -- Configuração
  restore_type VARCHAR(20) DEFAULT 'full', -- full, partial
  tables_to_restore TEXT[], -- Se partial
  restore_to_point_in_time TIMESTAMPTZ, -- Se PITR

  -- Opções
  overwrite_existing BOOLEAN DEFAULT false,
  create_restore_point BOOLEAN DEFAULT true, -- Backup antes de restaurar

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  error_message TEXT,

  -- Resultado
  records_restored INTEGER,
  conflicts_found INTEGER,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5.4 COMPLIANCE & LGPD
-- =====================================================

-- Consentimentos LGPD
CREATE TABLE IF NOT EXISTS data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Tipo de consentimento
  consent_type VARCHAR(50) NOT NULL, -- marketing, communications, data_processing, profiling

  -- Status
  is_granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- Evidência
  consent_source VARCHAR(50), -- web_form, chat, email, phone, imported
  consent_text TEXT, -- Texto exato que foi apresentado
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requisições de dados (LGPD Art. 18)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Identificação do titular
  requester_name VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(20),

  -- Tipo de requisição
  request_type VARCHAR(50) NOT NULL,
  -- access = Acesso aos dados
  -- rectification = Correção
  -- deletion = Exclusão/Anonimização
  -- portability = Portabilidade
  -- restriction = Restrição de processamento
  -- objection = Oposição ao processamento

  -- Detalhes
  description TEXT,
  requested_data TEXT[], -- Quais dados especificamente

  -- Verificação de identidade
  identity_verified BOOLEAN DEFAULT false,
  identity_verification_method VARCHAR(50),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  -- pending, under_review, identity_verification_required, approved, completed, rejected

  -- Resposta
  response_text TEXT,
  response_sent_at TIMESTAMPTZ,

  -- Resultado (para exports)
  export_file_url TEXT,
  export_expires_at TIMESTAMPTZ,

  -- SLA LGPD: 15 dias
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Auditoria
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs de anonimização/exclusão
CREATE TABLE IF NOT EXISTS data_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Dados deletados
  entity_type VARCHAR(50) NOT NULL, -- contact, conversation, deal
  entity_id UUID NOT NULL,
  entity_identifier VARCHAR(255), -- Email, telefone, etc para referência

  -- Motivo
  deletion_reason VARCHAR(100) NOT NULL, -- lgpd_request, retention_policy, user_request, churned
  request_id UUID REFERENCES data_subject_requests(id),

  -- Ação
  action_type VARCHAR(20) NOT NULL, -- anonymize, soft_delete, hard_delete

  -- Dados antes da exclusão (hash para auditoria)
  data_hash VARCHAR(64), -- SHA256 dos dados

  -- Quem executou
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Políticas de retenção de dados
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Tipo de dado
  data_type VARCHAR(50) NOT NULL, -- contacts, conversations, deals, files, logs

  -- Política
  retention_days INTEGER NOT NULL, -- Quantos dias manter
  action_after_retention VARCHAR(20) DEFAULT 'anonymize', -- anonymize, delete, archive

  -- Condições
  conditions JSONB DEFAULT '{}',
  -- Exemplo: {"status": ["closed"], "min_inactivity_days": 180}

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para anonimizar contato (LGPD)
CREATE OR REPLACE FUNCTION anonymize_contact(
  p_contact_id UUID,
  p_reason VARCHAR(100) DEFAULT 'lgpd_request',
  p_request_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_contact RECORD;
  v_company_id UUID;
BEGIN
  -- Buscar contato
  SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;

  v_company_id := v_contact.company_id;

  -- Criar log antes de anonimizar
  INSERT INTO data_deletion_logs (
    company_id, entity_type, entity_id, entity_identifier,
    deletion_reason, request_id, action_type, deleted_by
  ) VALUES (
    v_company_id, 'contact', p_contact_id, v_contact.email,
    p_reason, p_request_id, 'anonymize', auth.uid()
  );

  -- Anonimizar dados do contato
  UPDATE contacts
  SET
    name = 'Usuário Anônimo',
    email = 'anonymized_' || id || '@deleted.local',
    phone = NULL,
    avatar_url = NULL,
    tags = '{}',
    custom_fields = '{}',
    notes = '[DADOS ANONIMIZADOS POR SOLICITAÇÃO LGPD]',
    updated_at = NOW()
  WHERE id = p_contact_id;

  -- Anonimizar mensagens relacionadas
  UPDATE messages
  SET body = '[MENSAGEM ANONIMIZADA]'
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE contact_id = p_contact_id
  );

  -- Criar audit log
  PERFORM create_audit_log(
    'anonymize',
    'contact',
    p_contact_id,
    v_contact.name,
    to_jsonb(v_contact),
    jsonb_build_object('anonymized', true, 'reason', p_reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Índices
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_white_label_company ON white_label_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_company ON custom_domains(company_id);
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(key);
CREATE INDEX IF NOT EXISTS idx_custom_roles_company ON custom_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_company ON backup_history(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_consents_contact ON data_consents(contact_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_dsr_company_status ON data_subject_requests(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_entity ON data_deletion_logs(entity_type, entity_id);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- White Label - Apenas admins
DROP POLICY IF EXISTS "Admins can manage white label settings" ON white_label_settings;
CREATE POLICY "Admins can manage white label settings" ON white_label_settings
  FOR ALL USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner')
    )
  );

-- Custom Domains - Apenas admins
DROP POLICY IF EXISTS "Admins can manage custom domains" ON custom_domains;
CREATE POLICY "Admins can manage custom domains" ON custom_domains
  FOR ALL USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner')
    )
  );

-- Permissions - Todos podem ver
DROP POLICY IF EXISTS "All users can view permissions" ON permissions;
CREATE POLICY "All users can view permissions" ON permissions
  FOR SELECT USING (true);

-- Custom Roles - Usuários da empresa
DROP POLICY IF EXISTS "Users can view roles from their company" ON custom_roles;
CREATE POLICY "Users can view roles from their company" ON custom_roles
  FOR SELECT USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage roles" ON custom_roles;
CREATE POLICY "Admins can manage roles" ON custom_roles
  FOR ALL USING (
    company_id IN (
      SELECT cm.company_id FROM company_members cm
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner')
    )
  );

-- User Roles - Usuários podem ver seus próprios roles
DROP POLICY IF EXISTS "Users can view their roles" ON user_roles;
CREATE POLICY "Users can view their roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid() OR company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- Data Consents - Usuários da empresa
DROP POLICY IF EXISTS "Users can manage consents from their company" ON data_consents;
CREATE POLICY "Users can manage consents from their company" ON data_consents
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Data Subject Requests - Usuários da empresa
DROP POLICY IF EXISTS "Users can manage DSR from their company" ON data_subject_requests;
CREATE POLICY "Users can manage DSR from their company" ON data_subject_requests
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- =====================================================
-- Seed Permissions
-- =====================================================

INSERT INTO permissions (key, name, description, resource, action, category) VALUES
-- Contacts
('contacts.create', 'Criar Contatos', 'Adicionar novos contatos', 'contacts', 'create', 'data_management'),
('contacts.read', 'Ver Contatos', 'Visualizar informações de contatos', 'contacts', 'read', 'data_management'),
('contacts.update', 'Editar Contatos', 'Modificar informações de contatos', 'contacts', 'update', 'data_management'),
('contacts.delete', 'Excluir Contatos', 'Remover contatos permanentemente', 'contacts', 'delete', 'data_management'),
('contacts.export', 'Exportar Contatos', 'Exportar dados de contatos', 'contacts', 'export', 'data_management'),

-- Conversations
('conversations.read', 'Ver Conversas', 'Visualizar conversas', 'conversations', 'read', 'data_management'),
('conversations.respond', 'Responder Conversas', 'Enviar mensagens', 'conversations', 'update', 'data_management'),
('conversations.assign', 'Atribuir Conversas', 'Atribuir conversas a agentes', 'conversations', 'update', 'data_management'),
('conversations.close', 'Fechar Conversas', 'Marcar conversas como resolvidas', 'conversations', 'update', 'data_management'),

-- Deals
('deals.create', 'Criar Deals', 'Adicionar novos deals', 'deals', 'create', 'data_management'),
('deals.read', 'Ver Deals', 'Visualizar deals', 'deals', 'read', 'data_management'),
('deals.update', 'Editar Deals', 'Modificar deals', 'deals', 'update', 'data_management'),
('deals.delete', 'Excluir Deals', 'Remover deals', 'deals', 'delete', 'data_management'),

-- Settings
('settings.general', 'Configurações Gerais', 'Alterar configurações da empresa', 'settings', 'update', 'configuration'),
('settings.billing', 'Configurações de Cobrança', 'Gerenciar planos e pagamentos', 'settings', 'update', 'billing'),
('settings.integrations', 'Configurações de Integrações', 'Gerenciar integrações', 'settings', 'update', 'configuration'),
('settings.users', 'Gerenciar Usuários', 'Adicionar/remover usuários', 'settings', 'update', 'configuration'),

-- Analytics
('analytics.view', 'Ver Relatórios', 'Visualizar dashboards e relatórios', 'analytics', 'read', 'data_management'),
('analytics.export', 'Exportar Relatórios', 'Exportar dados de relatórios', 'analytics', 'export', 'data_management')

ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Feature Flags
-- =====================================================

INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES
  ('white_label', 'White Label', 'Personalização completa da marca e domínios customizados', 'admin', true, 'Palette', 50),
  ('rbac', 'Permissões Avançadas (RBAC)', 'Controle granular de permissões por role', 'admin', true, 'Shield', 51),
  ('backup_restore', 'Backup & Restore', 'Backup automático e recuperação de dados', 'admin', true, 'Database', 52),
  ('lgpd_compliance', 'Conformidade LGPD', 'Ferramentas de conformidade com LGPD', 'admin', true, 'FileCheck', 53),
  ('data_retention', 'Políticas de Retenção', 'Gestão automática de retenção de dados', 'admin', true, 'Clock', 54),
  ('custom_domains', 'Domínios Customizados', 'Use seu próprio domínio', 'admin', true, 'Globe', 55)
ON CONFLICT (feature_key) DO NOTHING;

-- =====================================================
-- Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION user_has_permission(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION anonymize_contact(UUID, VARCHAR, UUID) TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE white_label_settings IS 'Configurações de personalização de marca por empresa';
COMMENT ON TABLE custom_domains IS 'Domínios customizados para white label';
COMMENT ON TABLE permissions IS 'Lista de permissões granulares do sistema';
COMMENT ON TABLE custom_roles IS 'Roles customizados por empresa';
COMMENT ON TABLE data_subject_requests IS 'Requisições de titulares de dados (LGPD Art. 18)';
COMMENT ON FUNCTION anonymize_contact IS 'Anonimiza dados de contato para conformidade LGPD';
