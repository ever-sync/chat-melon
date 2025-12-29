-- =====================================================
-- Corrigir políticas RLS para contact_categories e contact_settings
-- Usar company_members para validação de acesso
-- =====================================================

-- 1. Políticas para contact_categories
DROP POLICY IF EXISTS "Users can view their company's contact categories" ON contact_categories;
CREATE POLICY "Users can view their company's contact categories"
  ON contact_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_categories.company_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can insert their company's contact categories" ON contact_categories;
CREATE POLICY "Users can insert their company's contact categories"
  ON contact_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_categories.company_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update their company's contact categories" ON contact_categories;
CREATE POLICY "Users can update their company's contact categories"
  ON contact_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_categories.company_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can delete their company's contact categories" ON contact_categories;
CREATE POLICY "Users can delete their company's contact categories"
  ON contact_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_categories.company_id
        AND is_active = true
    )
  );

-- 2. Políticas para contact_settings
DROP POLICY IF EXISTS "Users can view their company's contact settings" ON contact_settings;
CREATE POLICY "Users can view their company's contact settings"
  ON contact_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_settings.company_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can insert their company's contact settings" ON contact_settings;
CREATE POLICY "Users can insert their company's contact settings"
  ON contact_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_settings.company_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update their company's contact settings" ON contact_settings;
CREATE POLICY "Users can update their company's contact settings"
  ON contact_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_settings.company_id
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can delete their company's contact settings" ON contact_settings;
CREATE POLICY "Users can delete their company's contact settings"
  ON contact_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = contact_settings.company_id
        AND is_active = true
    )
  );

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS de contact_categories e contact_settings corrigidas!';
END $$;
