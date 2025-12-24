-- =====================================================
-- Fix Chatbot RLS Policies
-- Use profiles.company_id instead of company_members
-- =====================================================

-- Create helper function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- 1. Chatbots
-- =====================================================

DROP POLICY IF EXISTS "Users can view chatbots from their company" ON chatbots;
DROP POLICY IF EXISTS "Users can create chatbots in their company" ON chatbots;
DROP POLICY IF EXISTS "Users can update chatbots from their company" ON chatbots;
DROP POLICY IF EXISTS "Users can delete chatbots from their company" ON chatbots;
DROP POLICY IF EXISTS "Users can manage chatbots from their company" ON chatbots;

-- SELECT
CREATE POLICY "Users can view chatbots from their company"
  ON chatbots FOR SELECT
  USING (company_id = public.get_user_company_id());

-- INSERT
CREATE POLICY "Users can create chatbots in their company"
  ON chatbots FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

-- UPDATE
CREATE POLICY "Users can update chatbots from their company"
  ON chatbots FOR UPDATE
  USING (company_id = public.get_user_company_id());

-- DELETE
CREATE POLICY "Users can delete chatbots from their company"
  ON chatbots FOR DELETE
  USING (company_id = public.get_user_company_id());

-- =====================================================
-- 2. Chatbot Versions
-- =====================================================

DROP POLICY IF EXISTS "Users can view chatbot versions from their company" ON chatbot_versions;
DROP POLICY IF EXISTS "Users can create chatbot versions in their company" ON chatbot_versions;
DROP POLICY IF EXISTS "Users can update chatbot versions from their company" ON chatbot_versions;
DROP POLICY IF EXISTS "Users can delete chatbot versions from their company" ON chatbot_versions;

-- SELECT
CREATE POLICY "Users can view chatbot versions from their company"
  ON chatbot_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_versions.chatbot_id
        AND c.company_id = public.get_user_company_id()
    )
  );

-- INSERT
CREATE POLICY "Users can create chatbot versions in their company"
  ON chatbot_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_versions.chatbot_id
        AND c.company_id = public.get_user_company_id()
    )
  );

-- UPDATE
CREATE POLICY "Users can update chatbot versions from their company"
  ON chatbot_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_versions.chatbot_id
        AND c.company_id = public.get_user_company_id()
    )
  );

-- DELETE
CREATE POLICY "Users can delete chatbot versions from their company"
  ON chatbot_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_versions.chatbot_id
        AND c.company_id = public.get_user_company_id()
    )
  );

-- =====================================================
-- 3. Chatbot Executions
-- =====================================================

DROP POLICY IF EXISTS "Users can view chatbot executions from their company" ON chatbot_executions;
DROP POLICY IF EXISTS "System can create chatbot executions" ON chatbot_executions;
DROP POLICY IF EXISTS "Users can update chatbot executions from their company" ON chatbot_executions;
DROP POLICY IF EXISTS "Users can view executions from their company" ON chatbot_executions;

-- SELECT
CREATE POLICY "Users can view chatbot executions from their company"
  ON chatbot_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_executions.chatbot_id
        AND c.company_id = public.get_user_company_id()
    )
  );

-- INSERT (para criação de execuções via sistema)
CREATE POLICY "System can create chatbot executions"
  ON chatbot_executions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_executions.chatbot_id
        AND c.company_id = public.get_user_company_id()
    )
  );

-- UPDATE
CREATE POLICY "Users can update chatbot executions from their company"
  ON chatbot_executions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chatbots c
      WHERE c.id = chatbot_executions.chatbot_id
        AND c.company_id = public.get_user_company_id()
    )
  );

-- =====================================================
-- 4. Chatbot Templates
-- =====================================================

DROP POLICY IF EXISTS "Users can view templates" ON chatbot_templates;
DROP POLICY IF EXISTS "Users can create templates in their company" ON chatbot_templates;
DROP POLICY IF EXISTS "Users can update their company templates" ON chatbot_templates;
DROP POLICY IF EXISTS "Users can delete their company templates" ON chatbot_templates;
DROP POLICY IF EXISTS "Users can view system templates and their own" ON chatbot_templates;
DROP POLICY IF EXISTS "Users can manage their own templates" ON chatbot_templates;

-- SELECT (templates do sistema ou da empresa)
CREATE POLICY "Users can view templates"
  ON chatbot_templates FOR SELECT
  USING (
    is_system = true
    OR company_id = public.get_user_company_id()
  );

-- INSERT
CREATE POLICY "Users can create templates in their company"
  ON chatbot_templates FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

-- UPDATE
CREATE POLICY "Users can update their company templates"
  ON chatbot_templates FOR UPDATE
  USING (company_id = public.get_user_company_id());

-- DELETE
CREATE POLICY "Users can delete their company templates"
  ON chatbot_templates FOR DELETE
  USING (company_id = public.get_user_company_id());

-- =====================================================
-- Verificação
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '===================================================';
  RAISE NOTICE 'Chatbot RLS policies updated to use profiles.company_id!';
  RAISE NOTICE '===================================================';
END $$;
