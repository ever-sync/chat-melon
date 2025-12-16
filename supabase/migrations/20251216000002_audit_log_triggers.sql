-- =====================================================
-- Audit Log Triggers - Automação de Logging
-- =====================================================

-- Função genérica para criar audit log em triggers
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_resource_name TEXT;
  v_action VARCHAR(100);
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old_values := to_jsonb(OLD);
    v_new_values := NULL;
  END IF;

  -- Obter company_id do registro (se existir)
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_company_id := NEW.company_id;
    -- Tentar obter nome do recurso
    BEGIN
      EXECUTE format('SELECT COALESCE($1.name, $1.title, $1.email, $1.id::text)') INTO v_resource_name USING NEW;
    EXCEPTION WHEN OTHERS THEN
      v_resource_name := NEW.id::TEXT;
    END;
  ELSE
    v_company_id := OLD.company_id;
    v_resource_name := OLD.id::TEXT;
  END IF;

  -- Inserir log de auditoria
  INSERT INTO audit_logs (
    company_id,
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    resource_name,
    old_values,
    new_values,
    metadata,
    severity,
    category
  )
  SELECT
    v_company_id,
    auth.uid(),
    u.email,
    v_action,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_resource_name,
    v_old_values,
    v_new_values,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'operation', TG_OP
    ),
    'info',
    'data_access'
  FROM auth.users u
  WHERE u.id = auth.uid();

  -- Se não houver usuário autenticado, ainda assim logar
  IF NOT FOUND THEN
    INSERT INTO audit_logs (
      company_id,
      action,
      resource_type,
      resource_id,
      resource_name,
      old_values,
      new_values,
      metadata,
      severity,
      category
    ) VALUES (
      v_company_id,
      v_action,
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      v_resource_name,
      v_old_values,
      v_new_values,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'operation', TG_OP,
        'system_action', true
      ),
      'info',
      'data_access'
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers para tabelas críticas
-- =====================================================

-- Contacts
DROP TRIGGER IF EXISTS audit_contacts ON contacts;
CREATE TRIGGER audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Deals
DROP TRIGGER IF EXISTS audit_deals ON deals;
CREATE TRIGGER audit_deals
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Conversations (apenas delete e update de status)
DROP TRIGGER IF EXISTS audit_conversations ON conversations;
CREATE TRIGGER audit_conversations
  AFTER UPDATE OR DELETE ON conversations
  FOR EACH ROW
  WHEN (TG_OP = 'DELETE' OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION audit_log_trigger();

-- Users/Profiles
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Company Members
DROP TRIGGER IF EXISTS audit_company_members ON company_members;
CREATE TRIGGER audit_company_members
  AFTER INSERT OR UPDATE OR DELETE ON company_members
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Orders
DROP TRIGGER IF EXISTS audit_orders ON orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- API Keys
DROP TRIGGER IF EXISTS audit_api_keys ON api_keys;
CREATE TRIGGER audit_api_keys
  AFTER INSERT OR UPDATE OR DELETE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Webhooks
DROP TRIGGER IF EXISTS audit_webhooks ON webhooks;
CREATE TRIGGER audit_webhooks
  AFTER INSERT OR UPDATE OR DELETE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- =====================================================
-- Função para log de autenticação
-- =====================================================

CREATE OR REPLACE FUNCTION log_auth_event(
  p_event_type VARCHAR(50), -- login, logout, failed_login, password_reset, 2fa_enabled, 2fa_disabled
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_log_id UUID;
  v_severity VARCHAR(20);
BEGIN
  -- Obter company_id do usuário
  IF p_user_id IS NOT NULL THEN
    SELECT company_id INTO v_company_id
    FROM company_members
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;

  -- Definir severidade baseada no evento
  v_severity := CASE p_event_type
    WHEN 'failed_login' THEN 'warning'
    WHEN 'password_reset' THEN 'warning'
    WHEN 'account_locked' THEN 'critical'
    ELSE 'info'
  END;

  -- Inserir log
  INSERT INTO audit_logs (
    company_id,
    user_id,
    user_email,
    user_ip,
    user_agent,
    action,
    resource_type,
    resource_id,
    metadata,
    severity,
    category
  ) VALUES (
    v_company_id,
    p_user_id,
    p_user_email,
    p_ip_address,
    p_user_agent,
    p_event_type,
    'auth',
    p_user_id,
    p_metadata,
    v_severity,
    'authentication'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Função para log de exportação de dados
-- =====================================================

CREATE OR REPLACE FUNCTION log_data_export(
  p_resource_type VARCHAR(100),
  p_record_count INTEGER,
  p_export_format VARCHAR(20), -- csv, xlsx, pdf
  p_filters JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Obter company e email do usuário
  SELECT cm.company_id, u.email INTO v_company_id, v_user_email
  FROM company_members cm
  JOIN auth.users u ON u.id = cm.user_id
  WHERE cm.user_id = auth.uid()
  LIMIT 1;

  -- Inserir log
  INSERT INTO audit_logs (
    company_id,
    user_id,
    user_email,
    action,
    resource_type,
    metadata,
    severity,
    category
  ) VALUES (
    v_company_id,
    auth.uid(),
    v_user_email,
    'export',
    p_resource_type,
    jsonb_build_object(
      'record_count', p_record_count,
      'format', p_export_format,
      'filters', p_filters
    ),
    CASE WHEN p_record_count > 1000 THEN 'warning' ELSE 'info' END,
    'data_access'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Função para log de configurações alteradas
-- =====================================================

CREATE OR REPLACE FUNCTION log_settings_change(
  p_settings_type VARCHAR(100), -- company_settings, user_preferences, security_settings
  p_old_values JSONB,
  p_new_values JSONB
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Obter company e email
  SELECT cm.company_id, u.email INTO v_company_id, v_user_email
  FROM company_members cm
  JOIN auth.users u ON u.id = cm.user_id
  WHERE cm.user_id = auth.uid()
  LIMIT 1;

  -- Inserir log
  INSERT INTO audit_logs (
    company_id,
    user_id,
    user_email,
    action,
    resource_type,
    old_values,
    new_values,
    severity,
    category
  ) VALUES (
    v_company_id,
    auth.uid(),
    v_user_email,
    'update',
    p_settings_type,
    p_old_values,
    p_new_values,
    'info',
    'configuration'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- View para facilitar consultas de audit logs
-- =====================================================

CREATE OR REPLACE VIEW audit_logs_view AS
SELECT
  al.id,
  al.company_id,
  c.name as company_name,
  al.user_id,
  al.user_email,
  p.full_name as user_name,
  al.user_ip,
  al.user_agent,
  al.action,
  al.resource_type,
  al.resource_id,
  al.resource_name,
  al.old_values,
  al.new_values,
  al.metadata,
  al.severity,
  al.category,
  al.created_at,
  -- Campos calculados
  CASE
    WHEN al.action = 'create' THEN 'Criação'
    WHEN al.action = 'update' THEN 'Atualização'
    WHEN al.action = 'delete' THEN 'Exclusão'
    WHEN al.action = 'login' THEN 'Login'
    WHEN al.action = 'logout' THEN 'Logout'
    WHEN al.action = 'export' THEN 'Exportação'
    WHEN al.action = 'failed_login' THEN 'Login Falhou'
    ELSE al.action
  END as action_label,
  CASE al.resource_type
    WHEN 'contacts' THEN 'Contato'
    WHEN 'deals' THEN 'Negociação'
    WHEN 'conversations' THEN 'Conversa'
    WHEN 'profiles' THEN 'Usuário'
    WHEN 'company_members' THEN 'Membro da Equipe'
    WHEN 'orders' THEN 'Pedido'
    WHEN 'auth' THEN 'Autenticação'
    ELSE al.resource_type
  END as resource_type_label
FROM audit_logs al
LEFT JOIN companies c ON c.id = al.company_id
LEFT JOIN profiles p ON p.id = al.user_id;

-- =====================================================
-- Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION log_auth_event(VARCHAR, UUID, TEXT, INET, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_data_export(VARCHAR, INTEGER, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_settings_change(VARCHAR, JSONB, JSONB) TO authenticated;
GRANT SELECT ON audit_logs_view TO authenticated;

-- =====================================================
-- Limpeza automática de logs antigos (opcional)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND severity NOT IN ('warning', 'critical');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
