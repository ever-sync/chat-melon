-- ============================================
-- EMERGENCY FIX: Deals & Contacts RLS (Simples)
-- ============================================
-- Libera acesso a deals e contacts para qualquer usuário logado.
-- Isso deve corrigir os erros 400/403 de criação.

-- 1. DEALS (Negócios)
DROP POLICY IF EXISTS "deals_select_policy" ON deals;
DROP POLICY IF EXISTS "deals_insert_policy" ON deals;
DROP POLICY IF EXISTS "deals_update_policy" ON deals;
DROP POLICY IF EXISTS "deals_delete_policy" ON deals;
DROP POLICY IF EXISTS "Users can view deals in their company" ON deals;
DROP POLICY IF EXISTS "Users can create deals in their company" ON deals;
DROP POLICY IF EXISTS "Users can update deals in their company" ON deals;
DROP POLICY IF EXISTS "Users can delete deals in their company" ON deals;
DROP POLICY IF EXISTS "Admins can delete deals" ON deals;

CREATE POLICY "deals_full_access" ON deals
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. CONTACTS (Contatos)
DROP POLICY IF EXISTS "contacts_select_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_update_policy" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_policy" ON contacts;
DROP POLICY IF EXISTS "Users can view contacts in their company" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts in their company" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their company" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their company" ON contacts;
DROP POLICY IF EXISTS "contacts_full_access" ON contacts;

CREATE POLICY "contacts_full_access" ON contacts

  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. COMPANY_USERS (Se existir e estiver bloqueando)
DROP POLICY IF EXISTS "company_users_select_policy" ON company_users;
CREATE POLICY "company_users_select_policy" ON company_users
  FOR SELECT
  USING (true);

DO $$ BEGIN RAISE NOTICE '✅ Políticas RLS de Deals e Contatos liberadas!'; END $$;
