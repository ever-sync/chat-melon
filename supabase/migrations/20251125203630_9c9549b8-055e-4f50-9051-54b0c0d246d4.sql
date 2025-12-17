-- Criar tabela de notas de contatos
CREATE TABLE IF NOT EXISTS contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  note TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view notes in their company" ON contact_notes;
CREATE POLICY "Users can view notes in their company"
  ON contact_notes FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can create notes in their company" ON contact_notes;
CREATE POLICY "Users can create notes in their company"
  ON contact_notes FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notes" ON contact_notes;
CREATE POLICY "Users can update their own notes"
  ON contact_notes FOR UPDATE
  USING (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own notes" ON contact_notes;
CREATE POLICY "Users can delete their own notes"
  ON contact_notes FOR DELETE
  USING (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_company ON contact_notes(company_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_contact_notes_updated_at ON contact_notes;
CREATE TRIGGER update_contact_notes_updated_at
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();