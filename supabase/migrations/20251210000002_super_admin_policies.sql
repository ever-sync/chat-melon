-- ============================================
-- POLÍTICAS RLS PARA SUPER ADMIN VER TODAS AS EMPRESAS
-- ============================================

-- Permitir que Super Admins vejam todas as empresas
DROP POLICY IF EXISTS "Super Admin can view all companies" ON companies;

DROP POLICY IF EXISTS "Super Admin can view all companies" ON companies;
CREATE POLICY "Super Admin can view all companies"
ON companies FOR SELECT
USING (
  is_platform_admin(auth.uid())
);

-- Permitir que Super Admins atualizem qualquer empresa
DROP POLICY IF EXISTS "Super Admin can update all companies" ON companies;

DROP POLICY IF EXISTS "Super Admin can update all companies" ON companies;
CREATE POLICY "Super Admin can update all companies"
ON companies FOR UPDATE
USING (
  is_platform_admin(auth.uid())
);

-- Também criar políticas para platform_features (se não existirem)
DROP POLICY IF EXISTS "Super Admin can manage platform features" ON platform_features;
CREATE POLICY "Super Admin can manage platform features"
ON platform_features FOR ALL
USING (is_platform_admin(auth.uid()));

-- Também para subscription_plans
DROP POLICY IF EXISTS "Super Admin can manage subscription plans" ON subscription_plans;
CREATE POLICY "Super Admin can manage subscription plans"
ON subscription_plans FOR ALL
USING (is_platform_admin(auth.uid()));

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para Super Admin criadas com sucesso!';
  RAISE NOTICE '📋 Super Admins agora podem ver e gerenciar todas as empresas';
END $$;
