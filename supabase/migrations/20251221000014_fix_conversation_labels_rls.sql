-- =====================================================
-- Corrigir políticas RLS da tabela conversation_labels
-- Usar company_members em vez de get_user_company()
-- =====================================================

-- 1. Atualizar política de INSERT
DROP POLICY IF EXISTS "Users can add labels to conversations in their company" ON conversation_labels;

CREATE POLICY "Users can add labels to conversations in their company"
  ON conversation_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversations c
      INNER JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = conversation_labels.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- 2. Atualizar política de SELECT
DROP POLICY IF EXISTS "Users can view conversation labels in their company" ON conversation_labels;

CREATE POLICY "Users can view conversation labels in their company"
  ON conversation_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      INNER JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = conversation_labels.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- 3. Atualizar política de DELETE
DROP POLICY IF EXISTS "Users can remove labels from conversations in their company" ON conversation_labels;

CREATE POLICY "Users can remove labels from conversations in their company"
  ON conversation_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      INNER JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = conversation_labels.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS de conversation_labels corrigidas!';
  RAISE NOTICE 'Agora usando company_members em vez de get_user_company()';
END $$;
