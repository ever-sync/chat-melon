-- =====================================================
-- CONFIGURAÇÃO RÁPIDA DO CHATBOT
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Primeiro, veja as empresas disponíveis
SELECT id, name FROM companies WHERE is_active = true;

-- 2. Veja seu perfil atual
SELECT id, full_name, email, company_id FROM profiles WHERE id = auth.uid();

-- 3. Se company_id for NULL, associe seu perfil a uma empresa
-- Substitua 'ID_DA_EMPRESA' pelo ID mostrado no passo 1
/*
UPDATE profiles 
SET company_id = 'ID_DA_EMPRESA'
WHERE id = (SELECT id FROM profiles LIMIT 1);
*/

-- =====================================================
-- 4. Aplique as políticas RLS (execute isso uma vez)
-- =====================================================

-- Função auxiliar
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can manage chatbots from their company" ON chatbots;
DROP POLICY IF EXISTS "Users can view chatbots from their company" ON chatbots;
DROP POLICY IF EXISTS "Users can create chatbots in their company" ON chatbots;
DROP POLICY IF EXISTS "Users can update chatbots from their company" ON chatbots;
DROP POLICY IF EXISTS "Users can delete chatbots from their company" ON chatbots;

-- Criar políticas novas
CREATE POLICY "Users can view chatbots from their company"
  ON chatbots FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can create chatbots in their company"
  ON chatbots FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update chatbots from their company"
  ON chatbots FOR UPDATE
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete chatbots from their company"
  ON chatbots FOR DELETE
  USING (company_id = public.get_user_company_id());

-- Verificação
SELECT 'Chatbot RLS configurado com sucesso!' as status;
