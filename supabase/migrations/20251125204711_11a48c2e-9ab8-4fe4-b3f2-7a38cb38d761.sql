-- Tabela para armazenar contatos duplicados detectados
CREATE TABLE IF NOT EXISTS contact_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id_1 UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  contact_id_2 UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  match_reason TEXT NOT NULL, -- 'phone', 'email', 'name', 'multiple'
  similarity_score FLOAT NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'merged', 'ignored'
  merged_into UUID REFERENCES contacts(id) ON DELETE SET NULL,
  merged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  merged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_contacts CHECK (contact_id_1 != contact_id_2)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_duplicates_company ON contact_duplicates(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_duplicates_status ON contact_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_contact_duplicates_contact_1 ON contact_duplicates(contact_id_1);
CREATE INDEX IF NOT EXISTS idx_contact_duplicates_contact_2 ON contact_duplicates(contact_id_2);

-- Campo para soft delete em contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Índice para filtrar contatos ativos
CREATE INDEX IF NOT EXISTS idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;

-- RLS policies para contact_duplicates
ALTER TABLE contact_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view duplicates in their company"
  ON contact_duplicates FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can update duplicates in their company"
  ON contact_duplicates FOR UPDATE
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "System can insert duplicates"
  ON contact_duplicates FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()));

-- Comentários
COMMENT ON TABLE contact_duplicates IS 'Armazena contatos detectados como possíveis duplicados para revisão e merge';
COMMENT ON COLUMN contacts.deleted_at IS 'Data de soft delete do contato';
COMMENT ON COLUMN contacts.merged_into IS 'ID do contato para o qual este foi mesclado';

-- Trigger para updated_at
CREATE TRIGGER update_contact_duplicates_updated_at
  BEFORE UPDATE ON contact_duplicates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();