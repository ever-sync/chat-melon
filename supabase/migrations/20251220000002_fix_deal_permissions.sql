-- Políticas RLS para deal_activities
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

-- Políticas RLS para deal_notes (criando a tabela se não existir)
CREATE TABLE IF NOT EXISTS deal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  note TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_notes.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own deal notes" ON deal_notes;
CREATE POLICY "Users can update their own deal notes"
  ON deal_notes FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own deal notes" ON deal_notes;
CREATE POLICY "Users can delete their own deal notes"
  ON deal_notes FOR DELETE
  USING (created_by = auth.uid());

-- Políticas RLS para deal_files (criando a tabela se não existir)
CREATE TABLE IF NOT EXISTS deal_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_files.deal_id
      AND deals.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete their own deal files" ON deal_files;
CREATE POLICY "Users can delete their own deal files"
  ON deal_files FOR DELETE
  USING (uploaded_by = auth.uid());

-- Trigger para atualizar updated_at em deal_notes
CREATE OR REPLACE FUNCTION update_deal_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_deal_notes_updated_at_trigger ON deal_notes;
CREATE TRIGGER update_deal_notes_updated_at_trigger
  BEFORE UPDATE ON deal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_notes_updated_at();
