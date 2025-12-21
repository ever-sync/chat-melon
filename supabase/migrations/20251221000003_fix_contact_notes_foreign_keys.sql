-- =====================================================
-- Fix contact_notes foreign keys
-- Adiciona foreign keys nomeadas para permitir joins no Supabase
-- =====================================================

-- 1. Adicionar foreign key para user_id -> profiles.id
DO $$
BEGIN
  -- Remover constraint existente se houver (sem nome específico)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contact_notes_user_id_fkey'
    AND table_name = 'contact_notes'
  ) THEN
    ALTER TABLE contact_notes DROP CONSTRAINT contact_notes_user_id_fkey;
  END IF;

  -- Adicionar constraint com nome específico
  ALTER TABLE contact_notes
    ADD CONSTRAINT contact_notes_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignora se já existe
END $$;

-- 2. Adicionar foreign key para contact_id -> contacts.id (se ainda não existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contact_notes_contact_id_fkey'
    AND table_name = 'contact_notes'
  ) THEN
    ALTER TABLE contact_notes DROP CONSTRAINT contact_notes_contact_id_fkey;
  END IF;

  ALTER TABLE contact_notes
    ADD CONSTRAINT contact_notes_contact_id_fkey
    FOREIGN KEY (contact_id)
    REFERENCES contacts(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- 3. Adicionar foreign key para company_id -> companies.id (se ainda não existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contact_notes_company_id_fkey'
    AND table_name = 'contact_notes'
  ) THEN
    ALTER TABLE contact_notes DROP CONSTRAINT contact_notes_company_id_fkey;
  END IF;

  ALTER TABLE contact_notes
    ADD CONSTRAINT contact_notes_company_id_fkey
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- 4. Criar índices para performance (se ainda não existem)
CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id ON contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_company_id ON contact_notes(company_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Foreign keys adicionadas com sucesso!';
  RAISE NOTICE 'contact_notes agora tem foreign keys nomeadas para:';
  RAISE NOTICE '  - user_id -> profiles.id';
  RAISE NOTICE '  - contact_id -> contacts.id';
  RAISE NOTICE '  - company_id -> companies.id';
END $$;
