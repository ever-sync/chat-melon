-- ============================================
-- RLS POLICIES: SUBSCRIPTION E SUPER ADMIN
-- ============================================

-- 1. Políticas para Super Admin gerenciar subscription_plans
DROP POLICY IF EXISTS "Super Admin can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super Admin can insert subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super Admin can update subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super Admin can delete subscription plans" ON subscription_plans;

CREATE POLICY "Super Admin can insert subscription plans"
  ON subscription_plans
  FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Super Admin can update subscription plans"
  ON subscription_plans
  FOR UPDATE
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Super Admin can delete subscription plans"
  ON subscription_plans
  FOR DELETE
  USING (is_platform_admin(auth.uid()));

-- 2. Política para bloquear acesso se trial expirado
-- Esta política é aplicada em TODAS as tabelas principais
-- OBS: Comentada por enquanto para não quebrar o sistema existente
-- Será ativada após testes completos

/*
CREATE OR REPLACE FUNCTION user_can_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_company_id UUID;
  can_access BOOLEAN;
BEGIN
  -- Pega a company do usuário atual
  SELECT company_id INTO user_company_id
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Se não tem company, bloqueia (exceto super admin)
  IF user_company_id IS NULL THEN
    RETURN is_platform_admin(auth.uid());
  END IF;

  -- Verifica se a empresa pode acessar
  SELECT can_access_platform(user_company_id) INTO can_access;

  RETURN can_access;
END;
$$;
*/

-- 3. Função helper para Super Admin gerenciar trial de qualquer empresa
CREATE OR REPLACE FUNCTION can_manage_company_trial(company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN is_platform_admin(auth.uid());
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION is_trial_expired(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_platform(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_companies_in_group(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_company(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_company_trial(UUID) TO authenticated;

-- 5. Comentários
COMMENT ON FUNCTION is_trial_expired(UUID) IS 'Verifica se o trial de uma empresa expirou';
COMMENT ON FUNCTION can_access_platform(UUID) IS 'Verifica se uma empresa pode acessar a plataforma (trial válido ou assinatura ativa)';
COMMENT ON FUNCTION count_companies_in_group(UUID) IS 'Conta quantas empresas existem em um grupo (principal + adicionais)';
COMMENT ON FUNCTION can_create_company(UUID) IS 'Verifica se pode criar mais empresas no plano atual';
COMMENT ON FUNCTION can_manage_company_trial(UUID) IS 'Verifica se usuário pode gerenciar trial da empresa (apenas Super Admin)';
