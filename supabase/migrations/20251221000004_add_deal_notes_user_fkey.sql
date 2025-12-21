-- =====================================================
-- Adicionar foreign key nomeada em deal_notes.user_id
-- Necessário para permitir joins automáticos no Supabase
-- =====================================================

-- Adicionar foreign key nomeada para user_id -> profiles.id
DO $$
BEGIN
  -- Remover constraint existente se houver
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'deal_notes_user_id_fkey'
    AND table_name = 'deal_notes'
  ) THEN
    ALTER TABLE deal_notes DROP CONSTRAINT deal_notes_user_id_fkey;
  END IF;

  -- Adicionar constraint com nome específico
  ALTER TABLE deal_notes
    ADD CONSTRAINT deal_notes_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignora se já existe
END $$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Foreign key adicionada com sucesso!';
  RAISE NOTICE 'deal_notes.user_id -> profiles.id';
  RAISE NOTICE 'Agora os joins automáticos devem funcionar';
END $$;
