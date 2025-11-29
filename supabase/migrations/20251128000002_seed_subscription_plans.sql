-- ============================================
-- SEED: PLANOS DE ASSINATURA
-- ============================================
-- Cria os planos iniciais da plataforma

-- Limpar planos existentes (apenas em desenvolvimento)
-- DELETE FROM subscription_plans;

-- Inserir planos
INSERT INTO subscription_plans (
  name,
  slug,
  description,
  price_monthly,
  price_yearly,
  max_companies,
  max_users,
  max_conversations,
  trial_days,
  is_free_plan,
  order_index,
  is_active,
  features
) VALUES
(
  'Free',
  'free',
  'Ideal para começar e testar a plataforma',
  0.00,
  0.00,
  1,
  2,
  100,
  3,
  true,
  1,
  true,
  '{
    "chat": true,
    "contacts": true,
    "basic_crm": true,
    "templates": 5,
    "quick_replies": 10,
    "exports": false,
    "api_access": false,
    "white_label": false,
    "priority_support": false
  }'::jsonb
),
(
  'Starter',
  'starter',
  'Perfeito para pequenas equipes e negócios em crescimento',
  97.00,
  970.00,
  1,
  5,
  1000,
  7,
  false,
  2,
  true,
  '{
    "chat": true,
    "contacts": true,
    "basic_crm": true,
    "advanced_crm": true,
    "templates": 50,
    "quick_replies": 100,
    "exports": true,
    "automation": "basic",
    "campaigns": true,
    "reports": "basic",
    "api_access": false,
    "white_label": false,
    "priority_support": false
  }'::jsonb
),
(
  'Professional',
  'professional',
  'Para empresas que precisam de recursos avançados',
  197.00,
  1970.00,
  3,
  15,
  5000,
  7,
  false,
  3,
  true,
  '{
    "chat": true,
    "contacts": true,
    "basic_crm": true,
    "advanced_crm": true,
    "templates": "unlimited",
    "quick_replies": "unlimited",
    "exports": true,
    "automation": "advanced",
    "campaigns": true,
    "reports": "advanced",
    "gamification": true,
    "segments": true,
    "duplicates": true,
    "api_access": true,
    "webhooks": true,
    "white_label": false,
    "priority_support": true,
    "custom_fields": true
  }'::jsonb
),
(
  'Enterprise',
  'enterprise',
  'Solução completa para grandes operações',
  497.00,
  4970.00,
  10,
  50,
  50000,
  14,
  false,
  4,
  true,
  '{
    "chat": true,
    "contacts": true,
    "basic_crm": true,
    "advanced_crm": true,
    "templates": "unlimited",
    "quick_replies": "unlimited",
    "exports": true,
    "automation": "enterprise",
    "campaigns": true,
    "reports": "enterprise",
    "gamification": true,
    "segments": true,
    "duplicates": true,
    "api_access": true,
    "webhooks": true,
    "white_label": true,
    "priority_support": true,
    "dedicated_support": true,
    "custom_fields": true,
    "custom_integrations": true,
    "sla": true,
    "onboarding": true,
    "training": true
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_companies = EXCLUDED.max_companies,
  max_users = EXCLUDED.max_users,
  max_conversations = EXCLUDED.max_conversations,
  trial_days = EXCLUDED.trial_days,
  is_free_plan = EXCLUDED.is_free_plan,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Comentário sobre features JSONB
COMMENT ON COLUMN subscription_plans.features IS 'Features do plano em formato JSON: templates (number ou "unlimited"), automation ("basic", "advanced", "enterprise"), etc';
