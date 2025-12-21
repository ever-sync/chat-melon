-- Corrigir RLS para contact_notes

-- 1. Habilitar RLS
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view contact notes from their company" ON contact_notes;
DROP POLICY IF EXISTS "Users can insert contact notes for their company" ON contact_notes;
DROP POLICY IF EXISTS "Users can update their own contact notes" ON contact_notes;
DROP POLICY IF EXISTS "Users can delete their own contact notes" ON contact_notes;

-- 3. Criar políticas RLS

-- SELECT: Usuários podem ver notas de contatos da sua empresa
CREATE POLICY "Users can view contact notes from their company"
  ON contact_notes FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- INSERT: Usuários podem criar notas para contatos da sua empresa
CREATE POLICY "Users can insert contact notes for their company"
  ON contact_notes FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

-- UPDATE: Usuários podem atualizar suas próprias notas
CREATE POLICY "Users can update their own contact notes"
  ON contact_notes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Usuários podem deletar suas próprias notas
CREATE POLICY "Users can delete their own contact notes"
  ON contact_notes FOR DELETE
  USING (user_id = auth.uid());

-- 4. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_company_id ON contact_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id ON contact_notes(user_id);
