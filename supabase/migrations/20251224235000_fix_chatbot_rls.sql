-- =====================================================
-- Corrigir politicas RLS das tabelas de chatbot
-- Usar company_members em vez de get_user_company()
-- =====================================================

-- =====================================================
-- 1. Chatbots
-- =====================================================

DROP POLICY IF EXISTS "Users can manage chatbots from their company" ON chatbots;

-- SELECT
CREATE POLICY "Users can view chatbots from their company"
  ON chatbots FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbots.company_id
        AND is_active = true
    )
  );

-- INSERT
CREATE POLICY "Users can create chatbots in their company"
  ON chatbots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbots.company_id
        AND is_active = true
    )
  );

-- UPDATE
CREATE POLICY "Users can update chatbots from their company"
  ON chatbots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbots.company_id
        AND is_active = true
    )
  );

-- DELETE
CREATE POLICY "Users can delete chatbots from their company"
  ON chatbots FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbots.company_id
        AND is_active = true
    )
  );

-- =====================================================
-- 2. Chatbot Versions
-- =====================================================

DROP POLICY IF EXISTS "Users can view chatbot versions from their company" ON chatbot_versions;

-- SELECT
CREATE POLICY "Users can view chatbot versions from their company"
  ON chatbot_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chatbot_versions.chatbot_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- INSERT
CREATE POLICY "Users can create chatbot versions in their company"
  ON chatbot_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbots c
      JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chatbot_versions.chatbot_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- UPDATE
CREATE POLICY "Users can update chatbot versions from their company"
  ON chatbot_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chatbot_versions.chatbot_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- DELETE
CREATE POLICY "Users can delete chatbot versions from their company"
  ON chatbot_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chatbot_versions.chatbot_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- =====================================================
-- 3. Chatbot Executions
-- =====================================================

DROP POLICY IF EXISTS "Users can view executions from their company" ON chatbot_executions;

-- SELECT
CREATE POLICY "Users can view chatbot executions from their company"
  ON chatbot_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chatbot_executions.chatbot_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- INSERT (para sistema criar execucoes)
CREATE POLICY "System can create chatbot executions"
  ON chatbot_executions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbots c
      JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chatbot_executions.chatbot_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- UPDATE
CREATE POLICY "Users can update chatbot executions from their company"
  ON chatbot_executions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      JOIN company_members cm ON cm.company_id = c.company_id
      WHERE c.id = chatbot_executions.chatbot_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- =====================================================
-- 4. Chatbot Templates
-- =====================================================

DROP POLICY IF EXISTS "Users can view system templates and their own" ON chatbot_templates;
DROP POLICY IF EXISTS "Users can manage their own templates" ON chatbot_templates;

-- SELECT (templates do sistema ou da empresa)
CREATE POLICY "Users can view templates"
  ON chatbot_templates FOR SELECT
  USING (
    is_system = true
    OR EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbot_templates.company_id
        AND is_active = true
    )
  );

-- INSERT
CREATE POLICY "Users can create templates in their company"
  ON chatbot_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbot_templates.company_id
        AND is_active = true
    )
  );

-- UPDATE
CREATE POLICY "Users can update their company templates"
  ON chatbot_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbot_templates.company_id
        AND is_active = true
    )
  );

-- DELETE
CREATE POLICY "Users can delete their company templates"
  ON chatbot_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM company_members
      WHERE user_id = auth.uid()
        AND company_id = chatbot_templates.company_id
        AND is_active = true
    )
  );

-- =====================================================
-- Mensagem de sucesso
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Politicas RLS de chatbots corrigidas!';
  RAISE NOTICE 'Agora usando company_members em vez de get_user_company()';
  RAISE NOTICE '=====================================================';
END $$;
