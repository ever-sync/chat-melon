-- Add trial and extended company fields to companies table

-- Add trial management fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled'));

-- Add required company registration fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_name text; -- Razão Social
ALTER TABLE companies ADD COLUMN IF NOT EXISTS responsible_name text; -- Nome do responsável
ALTER TABLE companies ADD COLUMN IF NOT EXISTS responsible_phone text; -- Telefone do responsável

-- Add detailed address fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS complement text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS neighborhood text;

-- Create index on subscription_status for quick filtering
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);

-- Create function to check if company has access based on trial/subscription
CREATE OR REPLACE FUNCTION public.check_company_access(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE
      -- If has active subscription, always allow
      WHEN subscription_status = 'active' THEN true
      -- If in trial and not expired, allow
      WHEN subscription_status = 'trial' AND trial_ends_at > now() THEN true
      -- Otherwise, block
      ELSE false
    END
  FROM companies
  WHERE id = _company_id;
$$;

-- Create function to get trial info
CREATE OR REPLACE FUNCTION public.get_trial_info(_company_id uuid)
RETURNS TABLE (
  is_trial_active boolean,
  days_remaining integer,
  trial_ends_at timestamptz,
  can_access boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (subscription_status = 'trial' AND trial_ends_at > now()) as is_trial_active,
    CASE 
      WHEN trial_ends_at IS NOT NULL THEN 
        GREATEST(0, EXTRACT(days FROM (trial_ends_at - now()))::integer)
      ELSE 0
    END as days_remaining,
    trial_ends_at,
    check_company_access(_company_id) as can_access
  FROM companies
  WHERE id = _company_id;
$$;

COMMENT ON FUNCTION public.check_company_access IS 'Verifica se a empresa tem acesso à plataforma baseado em trial ou assinatura';
COMMENT ON FUNCTION public.get_trial_info IS 'Retorna informações sobre o trial da empresa';
