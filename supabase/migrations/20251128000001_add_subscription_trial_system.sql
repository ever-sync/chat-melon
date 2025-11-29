-- ============================================
-- SISTEMA DE TRIAL E SUBSCRIPTION
-- ============================================
-- Adiciona suporte completo para trials, múltiplas empresas e controle de assinatura

-- 1. Adicionar colunas na tabela subscription_plans
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS max_companies INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS is_free_plan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Adicionar colunas na tabela companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'suspended')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS is_primary_company BOOLEAN DEFAULT true;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_plan_id ON companies(plan_id);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);
CREATE INDEX IF NOT EXISTS idx_companies_trial_ends_at ON companies(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_companies_parent_company_id ON companies(parent_company_id);

-- 4. Função para verificar se trial expirou
CREATE OR REPLACE FUNCTION is_trial_expired(company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  company_record RECORD;
BEGIN
  SELECT subscription_status, trial_ends_at
  INTO company_record
  FROM companies
  WHERE id = company_id;

  IF company_record.subscription_status = 'trial' AND
     company_record.trial_ends_at IS NOT NULL AND
     company_record.trial_ends_at < NOW() THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 5. Função para verificar se empresa pode acessar plataforma
CREATE OR REPLACE FUNCTION can_access_platform(company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  company_record RECORD;
BEGIN
  SELECT subscription_status, trial_ends_at
  INTO company_record
  FROM companies
  WHERE id = company_id;

  -- Empresa ativa sempre pode acessar
  IF company_record.subscription_status = 'active' THEN
    RETURN true;
  END IF;

  -- Trial não expirado pode acessar
  IF company_record.subscription_status = 'trial' AND
     company_record.trial_ends_at IS NOT NULL AND
     company_record.trial_ends_at >= NOW() THEN
    RETURN true;
  END IF;

  -- Qualquer outro caso, não pode acessar
  RETURN false;
END;
$$;

-- 6. Função para contar empresas de um mesmo grupo (parent)
CREATE OR REPLACE FUNCTION count_companies_in_group(parent_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total
  FROM companies
  WHERE (id = parent_id AND is_primary_company = true)
     OR parent_company_id = parent_id;

  RETURN total;
END;
$$;

-- 7. Função para verificar se pode criar mais empresas no plano
CREATE OR REPLACE FUNCTION can_create_company(parent_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Pega o limite do plano da empresa principal
  SELECT sp.max_companies
  INTO max_allowed
  FROM companies c
  JOIN subscription_plans sp ON c.plan_id = sp.id
  WHERE c.id = parent_id;

  -- Conta quantas empresas já existem
  SELECT count_companies_in_group(parent_id)
  INTO current_count;

  -- Verifica se ainda pode criar mais
  RETURN current_count < max_allowed;
END;
$$;

-- 8. Trigger para atualizar subscription_started_at quando status muda para active
CREATE OR REPLACE FUNCTION set_subscription_started_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.subscription_status = 'active' AND OLD.subscription_status != 'active' THEN
    NEW.subscription_started_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_subscription_started_at ON companies;
CREATE TRIGGER trigger_set_subscription_started_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_subscription_started_at();

-- 9. Comentários nas colunas
COMMENT ON COLUMN companies.plan_id IS 'Plano de assinatura da empresa';
COMMENT ON COLUMN companies.trial_ends_at IS 'Data/hora de término do período de trial';
COMMENT ON COLUMN companies.subscription_status IS 'Status da assinatura: trial, active, expired, cancelled, suspended';
COMMENT ON COLUMN companies.subscription_started_at IS 'Data/hora em que a assinatura paga foi iniciada';
COMMENT ON COLUMN companies.parent_company_id IS 'ID da empresa principal (para empresas adicionais no mesmo plano)';
COMMENT ON COLUMN companies.is_primary_company IS 'Indica se é a empresa principal do grupo';

COMMENT ON COLUMN subscription_plans.max_companies IS 'Número máximo de empresas permitidas neste plano';
COMMENT ON COLUMN subscription_plans.trial_days IS 'Número de dias de trial gratuito';
COMMENT ON COLUMN subscription_plans.is_free_plan IS 'Indica se é o plano gratuito (limitado permanentemente)';
