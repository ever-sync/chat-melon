-- =====================================================
-- Limpar foreign keys duplicadas em deal_notes
-- O erro "more than one relationship" indica múltiplas FKs
-- =====================================================

-- 1. Remover TODAS as foreign keys relacionadas a user_id em deal_notes
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Buscar todas as constraints de foreign key que referenciam user_id
  FOR constraint_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'deal_notes'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
      AND tc.table_schema = 'public'
  LOOP
    RAISE NOTICE 'Removendo constraint: %', constraint_rec.constraint_name;
    EXECUTE format('ALTER TABLE deal_notes DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
  END LOOP;
END $$;

-- 2. Criar UMA ÚNICA foreign key com nome padrão
ALTER TABLE deal_notes
  ADD CONSTRAINT deal_notes_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- 3. Verificar se há outras foreign keys duplicadas (created_by)
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Buscar constraints de created_by que possam ter sobrado
  FOR constraint_rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'deal_notes'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'created_by'
      AND tc.table_schema = 'public'
  LOOP
    RAISE NOTICE 'Removendo constraint antiga (created_by): %', constraint_rec.constraint_name;
    EXECUTE format('ALTER TABLE deal_notes DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
  END LOOP;
END $$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Foreign keys limpas com sucesso!';
  RAISE NOTICE 'Agora deal_notes tem apenas UMA foreign key: user_id -> profiles.id';
END $$;
