-- =====================================================
-- SCRIPT DE CORREÇÃO COMPLETA - MELONCHAT
-- =====================================================
-- Versão: 1.0.0
-- Data: 16/12/2025
-- Descrição: Corrige todos os 7 erros críticos identificados
-- Execução: psql -h HOST -U postgres -d DATABASE -f fix_all_errors.sql
--           OU pelo Supabase Dashboard → SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- SEÇÃO 1: BACKUP E VALIDAÇÃO PRÉ-CORREÇÃO
-- =====================================================

-- Criar tabela de log para rastrear correções
CREATE TABLE IF NOT EXISTS error_fix_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_number INTEGER NOT NULL,
  error_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrar início da correção
INSERT INTO error_fix_log (error_number, error_name, status)
VALUES (0, 'SCRIPT_START', 'started');

-- =====================================================
-- ERRO #1: Adicionar sender_id em messages
-- =====================================================

DO $$
BEGIN
  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (1, 'messages.sender_id', 'started');

  -- Adicionar coluna sender_id
  ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS sender_id UUID
    REFERENCES profiles(id) ON DELETE SET NULL;

  -- Popular dados existentes (mensagens enviadas por agentes)
  UPDATE messages
  SET sender_id = user_id
  WHERE is_from_me = TRUE AND sender_id IS NULL;

  -- Criar índice para performance
  CREATE INDEX IF NOT EXISTS idx_messages_sender
    ON messages(sender_id)
    WHERE sender_id IS NOT NULL;

  -- Comentário para documentação
  COMMENT ON COLUMN messages.sender_id IS
    'ID do perfil que enviou a mensagem (agente). Usado para métricas de tempo de resposta.';

  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (1, 'messages.sender_id', 'completed');

  RAISE NOTICE '✅ ERRO #1 corrigido: messages.sender_id adicionado';
EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (1, 'messages.sender_id', 'failed', SQLERRM);
  RAISE NOTICE '❌ ERRO #1 falhou: %', SQLERRM;
END $$;

-- =====================================================
-- ERRO #2: Adicionar auto_assign em queues
-- =====================================================

DO $$
BEGIN
  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (2, 'queues.auto_assign', 'started');

  -- Adicionar coluna auto_assign
  ALTER TABLE queues
    ADD COLUMN IF NOT EXISTS auto_assign BOOLEAN DEFAULT TRUE;

  -- Atualizar filas existentes
  UPDATE queues
  SET auto_assign = TRUE
  WHERE auto_assign IS NULL;

  -- Comentário
  COMMENT ON COLUMN queues.auto_assign IS
    'Se TRUE, conversas são distribuídas automaticamente aos agentes da fila';

  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (2, 'queues.auto_assign', 'completed');

  RAISE NOTICE '✅ ERRO #2 corrigido: queues.auto_assign adicionado';
EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (2, 'queues.auto_assign', 'failed', SQLERRM);
  RAISE NOTICE '❌ ERRO #2 falhou: %', SQLERRM;
END $$;

-- =====================================================
-- ERRO #3: Resolver conflito channel_type ENUM vs VARCHAR
-- =====================================================

DO $$
BEGIN
  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (3, 'channel_type_conflict', 'started');

  -- Criar ENUM se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE channel_type AS ENUM (
      'whatsapp',
      'instagram',
      'messenger',
      'telegram',
      'widget',
      'email',
      'sms',
      'voice_call'
    );
    RAISE NOTICE 'ENUM channel_type criado';
  END IF;

  -- Verificar se a coluna existe e qual é o tipo
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'channel_type'
  ) THEN
    -- Se for VARCHAR, converter para ENUM
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'conversations'
        AND column_name = 'channel_type'
        AND data_type = 'character varying'
    ) THEN
      ALTER TABLE conversations
        ALTER COLUMN channel_type TYPE channel_type
        USING channel_type::channel_type;
      RAISE NOTICE 'Coluna channel_type convertida de VARCHAR para ENUM';
    ELSE
      RAISE NOTICE 'Coluna channel_type já é ENUM';
    END IF;
  ELSE
    -- Criar a coluna como ENUM
    ALTER TABLE conversations
      ADD COLUMN channel_type channel_type DEFAULT 'whatsapp';
    RAISE NOTICE 'Coluna channel_type criada como ENUM';
  END IF;

  -- Criar índice
  CREATE INDEX IF NOT EXISTS idx_conversations_channel_type
    ON conversations(channel_type);

  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (3, 'channel_type_conflict', 'completed');

  RAISE NOTICE '✅ ERRO #3 corrigido: channel_type padronizado como ENUM';
EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (3, 'channel_type_conflict', 'failed', SQLERRM);
  RAISE NOTICE '❌ ERRO #3 falhou: %', SQLERRM;
END $$;

-- =====================================================
-- ERRO #4: Padronizar user_id em queue_members
-- =====================================================

DO $$
BEGIN
  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (4, 'queue_members.user_id', 'started');

  -- Se member_id existir, renomear para user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'member_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE queue_members RENAME COLUMN member_id TO user_id;
    RAISE NOTICE 'Coluna member_id renomeada para user_id';
  END IF;

  -- Garantir que user_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE queue_members
      ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Coluna user_id criada';
  END IF;

  -- Adicionar/Recriar FK se necessário
  ALTER TABLE queue_members
    DROP CONSTRAINT IF EXISTS queue_members_user_id_fkey;
  ALTER TABLE queue_members
    ADD CONSTRAINT queue_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- Criar índice
  CREATE INDEX IF NOT EXISTS idx_queue_members_user
    ON queue_members(user_id) WHERE is_active = TRUE;

  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (4, 'queue_members.user_id', 'completed');

  RAISE NOTICE '✅ ERRO #4 corrigido: queue_members.user_id padronizado';
EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (4, 'queue_members.user_id', 'failed', SQLERRM);
  RAISE NOTICE '❌ ERRO #4 falhou: %', SQLERRM;
END $$;

-- =====================================================
-- ERRO #5: Garantir company_members existe
-- =====================================================

DO $$
BEGIN
  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (5, 'company_members', 'started');

  -- Criar tabela company_members se não existir
  CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
  );

  -- Criar índices
  CREATE INDEX IF NOT EXISTS idx_company_members_user
    ON company_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_company_members_company
    ON company_members(company_id);

  -- Enable RLS
  ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

  -- RLS Policies
  DROP POLICY IF EXISTS "Users can view their company memberships" ON company_members;
  CREATE POLICY "Users can view their company memberships" ON company_members
    FOR SELECT USING (user_id = auth.uid());

  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (5, 'company_members', 'completed');

  RAISE NOTICE '✅ ERRO #5 corrigido: company_members garantido';
EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (5, 'company_members', 'failed', SQLERRM);
  RAISE NOTICE '❌ ERRO #5 falhou: %', SQLERRM;
END $$;

-- =====================================================
-- ERRO #6: Garantir platform_features existe
-- =====================================================

DO $$
BEGIN
  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (6, 'platform_features', 'started');

  -- Criar tabela se não existir
  CREATE TABLE IF NOT EXISTS platform_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    is_global_enabled BOOLEAN DEFAULT TRUE,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Inserir features da Fase 3
  INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
  VALUES
    ('auto_assignment', 'Auto-Assignment', 'Distribuição automática de conversas para agentes', 'productivity', TRUE, 'Users', 30),
    ('sla_tracking', 'SLA Tracking', 'Rastreamento de tempo de resposta e resolução', 'analytics', TRUE, 'Clock', 31),
    ('routing_rules', 'Routing Rules', 'Regras de roteamento inteligente de conversas', 'automation', TRUE, 'GitBranch', 32),
    ('bulk_actions', 'Bulk Actions', 'Ações em massa em conversas e contatos', 'productivity', TRUE, 'Layers', 33),
    ('push_notifications', 'Push Notifications', 'Notificações push para agentes', 'engagement', TRUE, 'Bell', 34)
  ON CONFLICT (feature_key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    order_index = EXCLUDED.order_index;

  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (6, 'platform_features', 'completed');

  RAISE NOTICE '✅ ERRO #6 corrigido: platform_features garantido';
EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (6, 'platform_features', 'failed', SQLERRM);
  RAISE NOTICE '❌ ERRO #6 falhou: %', SQLERRM;
END $$;

-- =====================================================
-- AVISO #2: Adicionar external_id em contacts
-- =====================================================

DO $$
BEGIN
  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (7, 'contacts.external_id', 'started');

  -- Adicionar coluna external_id
  ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS external_id TEXT;

  -- Comentário
  COMMENT ON COLUMN contacts.external_id IS
    'ID externo do contato no canal de origem (ex: Instagram User ID, WhatsApp Number)';

  -- Criar índice composto
  CREATE INDEX IF NOT EXISTS idx_contacts_external
    ON contacts(company_id, external_id, channel_type)
    WHERE external_id IS NOT NULL;

  INSERT INTO error_fix_log (error_number, error_name, status)
  VALUES (7, 'contacts.external_id', 'completed');

  RAISE NOTICE '✅ AVISO #2 corrigido: contacts.external_id adicionado';
EXCEPTION WHEN OTHERS THEN
  INSERT INTO error_fix_log (error_number, error_name, status, error_message)
  VALUES (7, 'contacts.external_id', 'failed', SQLERRM);
  RAISE NOTICE '❌ AVISO #2 falhou: %', SQLERRM;
END $$;

-- =====================================================
-- SEÇÃO 2: VALIDAÇÃO PÓS-CORREÇÃO
-- =====================================================

-- Marcar fim do script
INSERT INTO error_fix_log (error_number, error_name, status)
VALUES (99, 'SCRIPT_END', 'completed');

-- Query de validação
DO $$
DECLARE
  v_failed_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '         RELATÓRIO DE VALIDAÇÃO PÓS-CORREÇÃO        ';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';

  -- Contar falhas
  SELECT COUNT(*) INTO v_failed_count
  FROM error_fix_log
  WHERE status = 'failed';

  IF v_failed_count > 0 THEN
    RAISE WARNING '⚠️  % correções falharam. Verifique error_fix_log para detalhes.', v_failed_count;
  ELSE
    RAISE NOTICE '✅ Todas as correções foram aplicadas com sucesso!';
  END IF;
END $$;

-- Query detalhada de validação
SELECT
  'messages.sender_id' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sender_id'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status,
  'Coluna para identificar quem enviou a mensagem' as description
UNION ALL
SELECT
  'queues.auto_assign',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queues' AND column_name = 'auto_assign'
  ) THEN '✅ OK' ELSE '❌ FALTA' END,
  'Flag para ativar distribuição automática'
UNION ALL
SELECT
  'channel_type ENUM',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'channel_type'
  ) THEN '✅ OK' ELSE '❌ FALTA' END,
  'Enum de tipos de canal (WhatsApp, Instagram, etc)'
UNION ALL
SELECT
  'queue_members.user_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) THEN '✅ OK' ELSE '❌ FALTA' END,
  'Coluna padronizada para membro da fila'
UNION ALL
SELECT
  'company_members table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'company_members'
  ) THEN '✅ OK' ELSE '❌ FALTA' END,
  'Tabela de membros da empresa'
UNION ALL
SELECT
  'platform_features table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'platform_features'
  ) THEN '✅ OK' ELSE '❌ FALTA' END,
  'Tabela de features da plataforma'
UNION ALL
SELECT
  'contacts.external_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'external_id'
  ) THEN '✅ OK' ELSE '❌ FALTA' END,
  'ID externo do contato (Instagram, WhatsApp, etc)';

-- Log de erros (se houver)
SELECT
  error_number,
  error_name,
  status,
  error_message,
  created_at
FROM error_fix_log
WHERE status = 'failed'
ORDER BY error_number;

COMMIT;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '           SCRIPT EXECUTADO COM SUCESSO             ';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Verificar resultados na query de validação acima';
  RAISE NOTICE '2. Testar funcionalidades afetadas:';
  RAISE NOTICE '   - Métricas de tempo de resposta';
  RAISE NOTICE '   - Auto-assignment de conversas';
  RAISE NOTICE '   - Multi-channel (WhatsApp, Instagram, etc)';
  RAISE NOTICE '3. Monitorar logs de erro no Supabase Dashboard';
  RAISE NOTICE '';
  RAISE NOTICE 'Documentação completa: ERROR_FIX_PLAN.md';
  RAISE NOTICE '';
END $$;
