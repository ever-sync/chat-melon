-- Script corrigido para adicionar permissões RLS nas tabelas de deals

-- 1. Adicionar coluna created_by em deal_notes se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'deal_notes' AND column_name = 'created_by') THEN
        ALTER TABLE deal_notes ADD COLUMN created_by UUID REFERENCES profiles(id);
    END IF;
END $$;

-- 2. Adicionar coluna uploaded_by em deal_files se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'deal_files' AND column_name = 'uploaded_by') THEN
        ALTER TABLE deal_files ADD COLUMN uploaded_by UUID REFERENCES profiles(id);
    END IF;
END $$;

-- 3. Políticas RLS para deal_notes
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deal notes from their company" ON deal_notes;
CREATE POLICY "Users can view deal notes from their company"
  ON deal_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert their own deal notes" ON deal_notes;
CREATE POLICY "Users can insert their own deal notes"
  ON deal_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own deal notes" ON deal_notes;
CREATE POLICY "Users can update their own deal notes"
  ON deal_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete their own deal notes" ON deal_notes;
CREATE POLICY "Users can delete their own deal notes"
  ON deal_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- 4. Políticas RLS para deal_files
ALTER TABLE deal_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deal files from their company" ON deal_files;
CREATE POLICY "Users can view deal files from their company"
  ON deal_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_files.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert deal files" ON deal_files;
CREATE POLICY "Users can insert deal files"
  ON deal_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_files.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete their own deal files" ON deal_files;
CREATE POLICY "Users can delete their own deal files"
  ON deal_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_files.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- 5. Políticas RLS para deal_activities
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deal activities from their company" ON deal_activities;
CREATE POLICY "Users can view deal activities from their company"
  ON deal_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_activities.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

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
