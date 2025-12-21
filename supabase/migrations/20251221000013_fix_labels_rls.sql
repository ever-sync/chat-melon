-- =====================================================
-- Corrigir políticas RLS da tabela labels
-- Usar company_members em vez de get_user_company()
-- =====================================================

-- 1. Função auxiliar para obter company_id do usuário via company_members
CREATE OR REPLACE FUNCTION get_user_company_from_members(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM company_members
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- 2. Atualizar política de INSERT
DROP POLICY IF EXISTS "Users can create labels in their company" ON labels;

CREATE POLICY "Users can create labels in their company"
  ON labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = labels.company_id
        AND is_active = true
    )
  );

-- 3. Atualizar política de SELECT
DROP POLICY IF EXISTS "Users can view labels in their company" ON labels;

CREATE POLICY "Users can view labels in their company"
  ON labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = labels.company_id
        AND is_active = true
    )
  );

-- 4. Atualizar política de UPDATE
DROP POLICY IF EXISTS "Users can update labels in their company" ON labels;

CREATE POLICY "Users can update labels in their company"
  ON labels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = labels.company_id
        AND is_active = true
    )
  );

-- 5. Atualizar política de DELETE
DROP POLICY IF EXISTS "Users can delete labels in their company" ON labels;

CREATE POLICY "Users can delete labels in their company"
  ON labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = labels.company_id
        AND is_active = true
    )
  );

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS de labels corrigidas!';
  RAISE NOTICE 'Agora usando company_members em vez de get_user_company()';
END $$;
