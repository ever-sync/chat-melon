-- =====================================================
-- Corrigir política RLS de INSERT em contact_notes
-- O problema pode ser a verificação de company_id
-- =====================================================

-- 1. Remover política de INSERT atual
DROP POLICY IF EXISTS "Users can insert contact notes for their company" ON contact_notes;

-- 2. Criar política mais robusta que verifica se o contato existe e pertence à mesma empresa
CREATE POLICY "Users can insert contact notes for their company"
  ON contact_notes FOR INSERT
  WITH CHECK (
    -- Verificar se o usuário está autenticado
    auth.uid() IS NOT NULL
    AND
    -- Verificar se user_id é o usuário autenticado
    user_id = auth.uid()
    AND
    -- Verificar se o contato pertence à mesma empresa do usuário
    EXISTS (
      SELECT 1
      FROM contacts c
      INNER JOIN profiles p ON p.company_id = c.company_id
      WHERE c.id = contact_notes.contact_id
        AND p.id = auth.uid()
        AND c.company_id = contact_notes.company_id
    )
  );

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Política RLS de contact_notes atualizada!';
  RAISE NOTICE 'Agora verifica se o contato pertence à mesma empresa do usuário';
END $$;
