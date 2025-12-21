-- =====================================================
-- Fix deal_notes e deal_activities
-- Corrige incompatibilidades entre tabelas e triggers
-- =====================================================

-- 1. Remover políticas antigas de deal_notes que usam created_by
-- IMPORTANTE: Fazer isso ANTES de remover a coluna
DROP POLICY IF EXISTS "Users can insert their own deal notes" ON deal_notes;
DROP POLICY IF EXISTS "Users can update their own deal notes" ON deal_notes;
DROP POLICY IF EXISTS "Users can delete their own deal notes" ON deal_notes;

-- 2. Garantir que deal_notes usa user_id (não created_by)
-- A migração anterior criou com user_id, mas outra tentou usar created_by
DO $$
BEGIN
  -- Se created_by existe e user_id não existe, renomear
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE deal_notes RENAME COLUMN created_by TO user_id;
  END IF;

  -- Se ambas existem, remover created_by e manter user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'created_by'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deal_notes' AND column_name = 'user_id'
  ) THEN
    -- Copiar dados de created_by para user_id onde user_id está NULL
    UPDATE deal_notes SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
    -- Remover coluna created_by
    ALTER TABLE deal_notes DROP COLUMN created_by;
  END IF;
END $$;

-- 3. Recriar políticas RLS para deal_notes usando user_id
CREATE POLICY "Users can insert their own deal notes"
  ON deal_notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own deal notes"
  ON deal_notes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own deal notes"
  ON deal_notes FOR DELETE
  USING (user_id = auth.uid());

-- 4. Recriar trigger para log_deal_note_activity com user_id correto
DROP TRIGGER IF EXISTS trigger_log_deal_note_activity ON deal_notes;
DROP FUNCTION IF EXISTS log_deal_note_activity();

CREATE OR REPLACE FUNCTION log_deal_note_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deal_activities (
    deal_id,
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    NEW.deal_id,
    NEW.user_id, -- usar user_id ao invés de created_by
    'note_added',
    'Nota adicionada',
    jsonb_build_object('note_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_deal_note_activity
  AFTER INSERT ON deal_notes
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_note_activity();

-- 5. Garantir que a política RLS de INSERT em deal_activities está correta
DROP POLICY IF EXISTS "Users can insert deal activities" ON deal_activities;
CREATE POLICY "Users can insert deal activities"
  ON deal_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_activities.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- 6. Adicionar foreign key nomeada para user_id -> profiles.id
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

-- 7. Adicionar índice em deal_notes.user_id para performance
CREATE INDEX IF NOT EXISTS idx_deal_notes_user_id ON deal_notes(user_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Fix aplicado com sucesso!';
  RAISE NOTICE 'deal_notes agora usa user_id consistentemente';
  RAISE NOTICE 'Trigger log_deal_note_activity atualizado';
  RAISE NOTICE 'Políticas RLS corrigidas';
  RAISE NOTICE 'Foreign key nomeada adicionada para joins';
END $$;
