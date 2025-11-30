-- ============================================
-- EMPRESA: CASCADE DELETE E CNPJ ÚNICO
-- ============================================

-- PASSO 1: LIMPAR DADOS ÓRFÃOS
-- Antes de adicionar as constraints CASCADE, precisamos limpar registros que referenciam empresas inexistentes

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Labels órfãos
  DELETE FROM labels WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de labels', deleted_count;
  END IF;

  -- Contacts órfãos
  DELETE FROM contacts WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de contacts', deleted_count;
  END IF;

  -- Conversations órfãos
  DELETE FROM conversations WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de conversations', deleted_count;
  END IF;

  -- Messages órfãos
  DELETE FROM messages WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de messages', deleted_count;
  END IF;

  -- Sectors órfãos
  DELETE FROM sectors WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de sectors', deleted_count;
  END IF;

  -- Blocked Contacts órfãos
  DELETE FROM blocked_contacts WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de blocked_contacts', deleted_count;
  END IF;

  -- Agent Status órfãos
  DELETE FROM agent_status WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de agent_status', deleted_count;
  END IF;

  -- Group Invites órfãos
  DELETE FROM group_invites WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de group_invites', deleted_count;
  END IF;

  -- Group Participants órfãos
  DELETE FROM group_participants WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de group_participants', deleted_count;
  END IF;

  -- Groups órfãos
  DELETE FROM groups WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de groups', deleted_count;
  END IF;

  -- Access Audit Log órfãos
  DELETE FROM access_audit_log WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de access_audit_log', deleted_count;
  END IF;

  -- Notification History órfãos
  DELETE FROM notification_history WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de notification_history', deleted_count;
  END IF;

  -- Notification Settings órfãos
  DELETE FROM notification_settings WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de notification_settings', deleted_count;
  END IF;

  -- Privacy Settings órfãos
  DELETE FROM privacy_settings WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de privacy_settings', deleted_count;
  END IF;

  -- Security Alerts órfãos
  DELETE FROM security_alerts WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de security_alerts', deleted_count;
  END IF;

  -- Status Stories órfãos
  DELETE FROM status_stories WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de status_stories', deleted_count;
  END IF;

  -- User Roles órfãos
  DELETE FROM user_roles WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de user_roles', deleted_count;
  END IF;

  -- Evolution Settings órfãos
  DELETE FROM evolution_settings WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de evolution_settings', deleted_count;
  END IF;

  -- Company Users órfãos
  DELETE FROM company_users WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de company_users', deleted_count;
  END IF;

  RAISE NOTICE '✅ Limpeza de dados órfãos concluída!';
END $$;

-- PASSO 2: ADICIONAR CONSTRAINT DE CNPJ ÚNICO
ALTER TABLE companies
ADD CONSTRAINT unique_company_cnpj UNIQUE (cnpj);

-- PASSO 3: ÍNDICE PARA PERFORMANCE NA BUSCA POR CNPJ
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);

-- PASSO 4: ATUALIZAR FOREIGN KEYS PARA CASCADE DELETE

-- 4.1 Company Users
ALTER TABLE company_users
DROP CONSTRAINT IF EXISTS company_users_company_id_fkey,
ADD CONSTRAINT company_users_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.2 Contacts
ALTER TABLE contacts
DROP CONSTRAINT IF EXISTS contacts_company_id_fkey,
ADD CONSTRAINT contacts_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.3 Conversations (company_id pode ser NULL)
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_company_id_fkey,
ADD CONSTRAINT conversations_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.4 Messages (company_id pode ser NULL)
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_company_id_fkey,
ADD CONSTRAINT messages_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.5 Labels
ALTER TABLE labels
DROP CONSTRAINT IF EXISTS labels_company_id_fkey,
ADD CONSTRAINT labels_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.6 Sectors
ALTER TABLE sectors
DROP CONSTRAINT IF EXISTS sectors_company_id_fkey,
ADD CONSTRAINT sectors_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.7 Blocked Contacts
ALTER TABLE blocked_contacts
DROP CONSTRAINT IF EXISTS blocked_contacts_company_id_fkey,
ADD CONSTRAINT blocked_contacts_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.8 Agent Status
ALTER TABLE agent_status
DROP CONSTRAINT IF EXISTS agent_status_company_id_fkey,
ADD CONSTRAINT agent_status_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.9 Group Invites
ALTER TABLE group_invites
DROP CONSTRAINT IF EXISTS group_invites_company_id_fkey,
ADD CONSTRAINT group_invites_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.10 Group Participants
ALTER TABLE group_participants
DROP CONSTRAINT IF EXISTS group_participants_company_id_fkey,
ADD CONSTRAINT group_participants_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.11 Groups
ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_company_id_fkey,
ADD CONSTRAINT groups_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.12 Access Audit Log
ALTER TABLE access_audit_log
DROP CONSTRAINT IF EXISTS access_audit_log_company_id_fkey,
ADD CONSTRAINT access_audit_log_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.13 Notification History
ALTER TABLE notification_history
DROP CONSTRAINT IF EXISTS notification_history_company_id_fkey,
ADD CONSTRAINT notification_history_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.14 Notification Settings
ALTER TABLE notification_settings
DROP CONSTRAINT IF EXISTS notification_settings_company_id_fkey,
ADD CONSTRAINT notification_settings_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.15 Privacy Settings
ALTER TABLE privacy_settings
DROP CONSTRAINT IF EXISTS privacy_settings_company_id_fkey,
ADD CONSTRAINT privacy_settings_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.16 Security Alerts
ALTER TABLE security_alerts
DROP CONSTRAINT IF EXISTS security_alerts_company_id_fkey,
ADD CONSTRAINT security_alerts_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.17 Status Stories
ALTER TABLE status_stories
DROP CONSTRAINT IF EXISTS status_stories_company_id_fkey,
ADD CONSTRAINT status_stories_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.18 User Roles
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_company_id_fkey,
ADD CONSTRAINT user_roles_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- 4.19 Evolution Settings (company_id pode ser NULL)
ALTER TABLE evolution_settings
DROP CONSTRAINT IF EXISTS evolution_settings_company_id_fkey,
ADD CONSTRAINT evolution_settings_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES companies(id)
  ON DELETE CASCADE;

-- Tabelas opcionais (só adiciona CASCADE se existirem)

-- 4.20 Contact Notes (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_notes') THEN
    -- Limpar órfãos
    DELETE FROM contact_notes WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE contact_notes
    DROP CONSTRAINT IF EXISTS contact_notes_company_id_fkey,
    ADD CONSTRAINT contact_notes_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.21 Custom Fields (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_fields') THEN
    DELETE FROM custom_fields WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE custom_fields
    DROP CONSTRAINT IF EXISTS custom_fields_company_id_fkey,
    ADD CONSTRAINT custom_fields_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.22 Custom Field Values (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_field_values') THEN
    DELETE FROM custom_field_values WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE custom_field_values
    DROP CONSTRAINT IF EXISTS custom_field_values_company_id_fkey,
    ADD CONSTRAINT custom_field_values_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.23 Segments (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'segments') THEN
    DELETE FROM segments WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE segments
    DROP CONSTRAINT IF EXISTS segments_company_id_fkey,
    ADD CONSTRAINT segments_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.24 Pipelines (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipelines') THEN
    DELETE FROM pipelines WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE pipelines
    DROP CONSTRAINT IF EXISTS pipelines_company_id_fkey,
    ADD CONSTRAINT pipelines_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.25 Pipeline Stages (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_stages') THEN
    DELETE FROM pipeline_stages WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE pipeline_stages
    DROP CONSTRAINT IF EXISTS pipeline_stages_company_id_fkey,
    ADD CONSTRAINT pipeline_stages_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.26 Deals (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals') THEN
    DELETE FROM deals WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE deals
    DROP CONSTRAINT IF EXISTS deals_company_id_fkey,
    ADD CONSTRAINT deals_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.27 Tasks (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DELETE FROM tasks WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_company_id_fkey,
    ADD CONSTRAINT tasks_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.28 Campaigns (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    DELETE FROM campaigns WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE campaigns
    DROP CONSTRAINT IF EXISTS campaigns_company_id_fkey,
    ADD CONSTRAINT campaigns_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.29 Campaign Contacts (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_contacts') THEN
    DELETE FROM campaign_contacts WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE campaign_contacts
    DROP CONSTRAINT IF EXISTS campaign_contacts_company_id_fkey,
    ADD CONSTRAINT campaign_contacts_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.30 Queues (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'queues') THEN
    DELETE FROM queues WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE queues
    DROP CONSTRAINT IF EXISTS queues_company_id_fkey,
    ADD CONSTRAINT queues_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.31 Queue Members (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'queue_members') THEN
    DELETE FROM queue_members WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE queue_members
    DROP CONSTRAINT IF EXISTS queue_members_company_id_fkey,
    ADD CONSTRAINT queue_members_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.32 Company Members (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_members') THEN
    DELETE FROM company_members WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE company_members
    DROP CONSTRAINT IF EXISTS company_members_company_id_fkey,
    ADD CONSTRAINT company_members_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.33 Teams (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
    DELETE FROM teams WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE teams
    DROP CONSTRAINT IF EXISTS teams_company_id_fkey,
    ADD CONSTRAINT teams_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4.34 Company Invites (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_invites') THEN
    DELETE FROM company_invites WHERE company_id NOT IN (SELECT id FROM companies);

    ALTER TABLE company_invites
    DROP CONSTRAINT IF EXISTS company_invites_company_id_fkey,
    ADD CONSTRAINT company_invites_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- PASSO 5: FUNÇÃO PARA VALIDAR CNPJ ANTES DE INSERIR/ATUALIZAR
CREATE OR REPLACE FUNCTION validate_unique_cnpj()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cnpj IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM companies
      WHERE cnpj = NEW.cnpj
      AND id != NEW.id
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'CNPJ já cadastrado. Este CNPJ já está sendo usado por outra empresa.'
        USING HINT = 'Verifique se você já possui uma conta ou entre em contato com o suporte.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 6: TRIGGER PARA VALIDAR CNPJ
DROP TRIGGER IF EXISTS trigger_validate_unique_cnpj ON companies;
CREATE TRIGGER trigger_validate_unique_cnpj
  BEFORE INSERT OR UPDATE OF cnpj ON companies
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_cnpj();

-- PASSO 7: COMENTÁRIOS
COMMENT ON CONSTRAINT unique_company_cnpj ON companies IS
  'Garante que não pode haver duas empresas ativas com o mesmo CNPJ';

COMMENT ON FUNCTION validate_unique_cnpj() IS
  'Valida se o CNPJ já está cadastrado antes de inserir/atualizar uma empresa';

-- PASSO 8: MENSAGEM DE SUCESSO
DO $$
BEGIN
  RAISE NOTICE '✅ Dados órfãos removidos!';
  RAISE NOTICE '✅ Cascade delete configurado com sucesso!';
  RAISE NOTICE '✅ CNPJ único garantido!';
  RAISE NOTICE '📋 Ao deletar uma empresa, TODOS os dados relacionados serão removidos automaticamente';
  RAISE NOTICE '🔒 CNPJs duplicados serão bloqueados na inserção/atualização';
END $$;
