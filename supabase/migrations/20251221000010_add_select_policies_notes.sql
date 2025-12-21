-- =====================================================
-- Adicionar políticas de SELECT para notas
-- Permite que usuários vejam notas da sua empresa
-- =====================================================

-- 1. Política de SELECT para deal_notes
DROP POLICY IF EXISTS "Users can view deal notes from their company" ON deal_notes;

CREATE POLICY "Users can view deal notes from their company"
  ON deal_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM deals d
      INNER JOIN company_members cm ON cm.company_id = d.company_id
      WHERE d.id = deal_notes.deal_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- 2. Política de SELECT para contact_notes (verificar se existe)
DROP POLICY IF EXISTS "Users can view contact notes from their company" ON contact_notes;

CREATE POLICY "Users can view contact notes from their company"
  ON contact_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM contacts c
      INNER JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = contact_notes.contact_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de SELECT criadas!';
  RAISE NOTICE 'Usuários agora podem ver notas da sua empresa';
END $$;
