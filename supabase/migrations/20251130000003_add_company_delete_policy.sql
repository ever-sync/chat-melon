-- ============================================
-- ADICIONAR POLÍTICA DE DELETE PARA COMPANIES
-- ============================================

-- Permitir que o criador da empresa possa deletá-la
DROP POLICY IF EXISTS "Users can delete their companies" ON companies;

DROP POLICY IF EXISTS "Users can delete their companies" ON companies;
CREATE POLICY "Users can delete their companies"
ON companies FOR DELETE
USING (auth.uid() = created_by);

COMMENT ON POLICY "Users can delete their companies" ON companies IS
  'Permite que o usuário que criou a empresa possa deletá-la';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Política de DELETE criada com sucesso!';
  RAISE NOTICE '📋 Usuários agora podem deletar as empresas que criaram';
  RAISE NOTICE '🔒 Apenas o criador (created_by) pode deletar a empresa';
END $$;
