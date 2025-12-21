-- Migration para adicionar foreign keys com nomes específicos para permitir joins
-- Isso é necessário para o Supabase Client poder fazer joins com nomes de constraints

-- ============================================
-- 0. Garantir que deal_notes tem coluna created_by
-- ============================================

-- Adicionar coluna created_by se não existir (para compatibilidade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'created_by'
  ) THEN
    -- Se user_id existe, renomear para created_by
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'deal_notes' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE deal_notes RENAME COLUMN user_id TO created_by;
    ELSE
      ALTER TABLE deal_notes ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Garantir que deal_notes tem company_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE deal_notes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

    -- Preencher company_id baseado no deal_id
    UPDATE deal_notes dn
    SET company_id = d.company_id
    FROM deals d
    WHERE dn.deal_id = d.id AND dn.company_id IS NULL;
  END IF;
END $$;

-- ============================================
-- 1. Foreign Keys para deal_tasks
-- ============================================

-- deal_tasks.assigned_to -> profiles.id
DO $$
BEGIN
  -- Remover constraint existente se houver (sem erro se não existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_tasks_assigned_to_fkey'
    AND table_name = 'deal_tasks'
  ) THEN
    ALTER TABLE deal_tasks DROP CONSTRAINT deal_tasks_assigned_to_fkey;
  END IF;

  -- Adicionar constraint com nome específico
  ALTER TABLE deal_tasks
    ADD CONSTRAINT deal_tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignora se já existe
  WHEN undefined_table THEN
    NULL; -- Ignora se tabela não existe
END $$;

-- deal_tasks.created_by -> profiles.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_tasks_created_by_fkey'
    AND table_name = 'deal_tasks'
  ) THEN
    ALTER TABLE deal_tasks DROP CONSTRAINT deal_tasks_created_by_fkey;
  END IF;

  ALTER TABLE deal_tasks
    ADD CONSTRAINT deal_tasks_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- deal_tasks.completed_by -> profiles.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_tasks_completed_by_fkey'
    AND table_name = 'deal_tasks'
  ) THEN
    ALTER TABLE deal_tasks DROP CONSTRAINT deal_tasks_completed_by_fkey;
  END IF;

  ALTER TABLE deal_tasks
    ADD CONSTRAINT deal_tasks_completed_by_fkey
    FOREIGN KEY (completed_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================
-- 2. Foreign Keys para deal_notes (se não existirem)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_notes_created_by_fkey'
    AND table_name = 'deal_notes'
  ) THEN
    ALTER TABLE deal_notes DROP CONSTRAINT deal_notes_created_by_fkey;
  END IF;

  ALTER TABLE deal_notes
    ADD CONSTRAINT deal_notes_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================
-- 3. Foreign Keys para deal_files (se não existirem)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_files_uploaded_by_fkey'
    AND table_name = 'deal_files'
  ) THEN
    ALTER TABLE deal_files DROP CONSTRAINT deal_files_uploaded_by_fkey;
  END IF;

  ALTER TABLE deal_files
    ADD CONSTRAINT deal_files_uploaded_by_fkey
    FOREIGN KEY (uploaded_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================
-- 4. Foreign Keys para deal_activities (se não existirem)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_activities_user_id_fkey'
    AND table_name = 'deal_activities'
  ) THEN
    ALTER TABLE deal_activities DROP CONSTRAINT deal_activities_user_id_fkey;
  END IF;

  ALTER TABLE deal_activities
    ADD CONSTRAINT deal_activities_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================
-- 5. Índices para performance dos joins
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deal_tasks_created_by ON deal_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_completed_by ON deal_tasks(completed_by);
CREATE INDEX IF NOT EXISTS idx_deal_notes_created_by ON deal_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_deal_files_uploaded_by ON deal_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_deal_activities_user_id ON deal_activities(user_id);

-- ============================================
-- 6. Criar bucket para arquivos de deals (se não existir)
-- ============================================

-- Nota: A criação do bucket deve ser feita via Dashboard do Supabase ou API Storage
-- O bucket 'deal-files' deve ter as seguintes configurações:
--   - Public: false (arquivos privados)
--   - File size limit: 10MB
--   - Allowed mime types: image/*, application/pdf, application/msword,
--     application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--     application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--     text/plain

-- Política de Storage para deal-files bucket (deve ser criada via Dashboard)
-- SELECT: authenticated users podem ver arquivos de suas empresas
-- INSERT: authenticated users podem fazer upload para suas empresas
-- DELETE: authenticated users podem deletar arquivos de suas empresas
