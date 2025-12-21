-- Adicionar foreign key constraints para permitir joins com profiles

-- 1. Para deal_notes.created_by -> profiles.id
DO $$
BEGIN
  -- Remover constraint existente se houver (sem erro se não existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_notes_created_by_fkey'
    AND table_name = 'deal_notes'
  ) THEN
    ALTER TABLE deal_notes DROP CONSTRAINT deal_notes_created_by_fkey;
  END IF;

  -- Adicionar constraint com nome específico
  ALTER TABLE deal_notes
    ADD CONSTRAINT deal_notes_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- 2. Para deal_files.uploaded_by -> profiles.id
DO $$
BEGIN
  -- Remover constraint existente se houver (sem erro se não existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_files_uploaded_by_fkey'
    AND table_name = 'deal_files'
  ) THEN
    ALTER TABLE deal_files DROP CONSTRAINT deal_files_uploaded_by_fkey;
  END IF;

  -- Adicionar constraint com nome específico
  ALTER TABLE deal_files
    ADD CONSTRAINT deal_files_uploaded_by_fkey
    FOREIGN KEY (uploaded_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
END $$;

-- 3. Criar índices para melhorar performance dos joins
CREATE INDEX IF NOT EXISTS idx_deal_notes_created_by ON deal_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_deal_files_uploaded_by ON deal_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_deal_notes_deal_id ON deal_notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_files_deal_id ON deal_files(deal_id);
