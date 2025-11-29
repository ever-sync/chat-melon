-- =============================================
-- SEED DATA: Subscription Plans
-- =============================================
-- Cria os planos iniciais da plataforma

-- Limpa dados existentes (apenas em desenvolvimento)
-- CUIDADO: Comente esta linha em produção se já tiver dados reais!
DELETE FROM plan_features WHERE plan_id IN (SELECT id FROM subscription_plans);
DELETE FROM subscription_plans;

-- Insere os 3 planos padrão
INSERT INTO subscription_plans (
  id,
  slug,
  name,
  price_monthly,
  price_yearly,
  stripe_price_id_monthly,
  stripe_price_id_yearly,
  max_companies,
  max_users,
  max_conversations,
  features,
  created_at,
  updated_at
) VALUES
  -- Plano Starter
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'starter',
    'Starter',
    97.00,
    931.20, -- 20% desconto anual (97 * 12 * 0.8)
    NULL, -- Stripe Price ID será configurado depois
    NULL,
    1, -- 1 empresa
    5, -- 5 usuários
    1000, -- 1.000 conversas/mês
    '{
      "whatsapp": true,
      "crm_basic": true,
      "reports": true,
      "support": "email"
    }'::jsonb,
    NOW(),
    NOW()
  ),

  -- Plano Professional (Mais Popular)
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'professional',
    'Professional',
    297.00,
    2851.20, -- 20% desconto anual
    NULL,
    NULL,
    3, -- 3 empresas
    15, -- 15 usuários
    5000, -- 5.000 conversas/mês
    '{
      "whatsapp": true,
      "crm_advanced": true,
      "reports_complete": true,
      "automation": true,
      "support": "priority"
    }'::jsonb,
    NOW(),
    NOW()
  ),

  -- Plano Enterprise
  (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'enterprise',
    'Enterprise',
    697.00,
    6691.20, -- 20% desconto anual
    NULL,
    NULL,
    NULL, -- Empresas ilimitadas
    50, -- 50 usuários
    NULL, -- Conversas ilimitadas
    '{
      "whatsapp": true,
      "crm_complete": true,
      "reports_advanced": true,
      "automation_complete": true,
      "white_label": true,
      "api_public": true,
      "support": "24/7"
    }'::jsonb,
    NOW(),
    NOW()
  );

-- =============================================
-- SEED DATA: Platform Features
-- =============================================
-- Cria as features controláveis da plataforma

DELETE FROM plan_features WHERE feature_id IN (SELECT id FROM platform_features);
DELETE FROM platform_features;

INSERT INTO platform_features (
  id,
  feature_key,
  name,
  description,
  category,
  is_global_enabled,
  icon,
  order_index,
  created_at,
  updated_at
) VALUES
  -- Comunicação
  (
    'f1111111-1111-1111-1111-111111111111'::uuid,
    'chat',
    'Chat WhatsApp',
    'Integração com WhatsApp via Evolution API',
    'communication',
    true,
    'MessageSquare',
    1,
    NOW(),
    NOW()
  ),
  (
    'f1111111-1111-1111-1111-111111111112'::uuid,
    'quick_replies',
    'Respostas Rápidas',
    'Templates de mensagens pré-configuradas',
    'communication',
    true,
    'Zap',
    2,
    NOW(),
    NOW()
  ),
  (
    'f1111111-1111-1111-1111-111111111113'::uuid,
    'queues',
    'Filas de Atendimento',
    'Sistema de distribuição de conversas',
    'communication',
    true,
    'ListOrdered',
    3,
    NOW(),
    NOW()
  ),

  -- CRM & Vendas
  (
    'f2222222-2222-2222-2222-222222222221'::uuid,
    'contacts',
    'Gestão de Contatos',
    'Cadastro e organização de contatos',
    'crm',
    true,
    'Users',
    10,
    NOW(),
    NOW()
  ),
  (
    'f2222222-2222-2222-2222-222222222222'::uuid,
    'deals_pipeline',
    'Pipeline de Vendas',
    'Funil de vendas com Kanban',
    'crm',
    true,
    'TrendingUp',
    11,
    NOW(),
    NOW()
  ),
  (
    'f2222222-2222-2222-2222-222222222223'::uuid,
    'custom_fields',
    'Campos Customizados',
    'Crie campos personalizados para contatos e deals',
    'crm',
    true,
    'Settings',
    12,
    NOW(),
    NOW()
  ),
  (
    'f2222222-2222-2222-2222-222222222224'::uuid,
    'proposals',
    'Propostas Comerciais',
    'Geração de propostas e orçamentos',
    'crm',
    true,
    'FileText',
    13,
    NOW(),
    NOW()
  ),

  -- Automação
  (
    'f3333333-3333-3333-3333-333333333331'::uuid,
    'workflows',
    'Workflows Visuais',
    'Criação de automações com drag & drop',
    'automation',
    true,
    'Workflow',
    20,
    NOW(),
    NOW()
  ),
  (
    'f3333333-3333-3333-3333-333333333332'::uuid,
    'campaigns',
    'Campanhas de Mensagens',
    'Envio em massa com segmentação',
    'automation',
    true,
    'Send',
    21,
    NOW(),
    NOW()
  ),
  (
    'f3333333-3333-3333-3333-333333333333'::uuid,
    'chatbot',
    'Chatbot com IA',
    'Atendimento automatizado com inteligência artificial',
    'automation',
    false, -- Desabilitado por padrão (em desenvolvimento)
    'Bot',
    22,
    NOW(),
    NOW()
  ),

  -- Analytics
  (
    'f4444444-4444-4444-4444-444444444441'::uuid,
    'reports_basic',
    'Relatórios Básicos',
    'Dashboards e métricas essenciais',
    'analytics',
    true,
    'BarChart',
    30,
    NOW(),
    NOW()
  ),
  (
    'f4444444-4444-4444-4444-444444444442'::uuid,
    'reports_advanced',
    'Relatórios Avançados',
    'Análises detalhadas e exportação de dados',
    'analytics',
    true,
    'LineChart',
    31,
    NOW(),
    NOW()
  ),
  (
    'f4444444-4444-4444-4444-444444444443'::uuid,
    'team_performance',
    'Performance da Equipe',
    'Métricas individuais por agente',
    'analytics',
    true,
    'Users',
    32,
    NOW(),
    NOW()
  ),

  -- Integrações
  (
    'f5555555-5555-5555-5555-555555555551'::uuid,
    'api_public',
    'API Pública',
    'Acesso programático via REST API',
    'integration',
    true,
    'Code',
    40,
    NOW(),
    NOW()
  ),
  (
    'f5555555-5555-5555-5555-555555555552'::uuid,
    'webhooks',
    'Webhooks',
    'Notificações em tempo real de eventos',
    'integration',
    true,
    'Webhook',
    41,
    NOW(),
    NOW()
  ),

  -- Administração
  (
    'f6666666-6666-6666-6666-666666666661'::uuid,
    'multi_company',
    'Multi-Empresa',
    'Gerenciar múltiplas empresas em uma conta',
    'admin',
    true,
    'Building',
    50,
    NOW(),
    NOW()
  ),
  (
    'f6666666-6666-6666-6666-666666666662'::uuid,
    'white_label',
    'White Label',
    'Personalização completa da marca',
    'admin',
    true,
    'Palette',
    51,
    NOW(),
    NOW()
  ),
  (
    'f6666666-6666-6666-6666-666666666663'::uuid,
    'gamification',
    'Gamificação',
    'Sistema de pontos e conquistas para equipe',
    'admin',
    true,
    'Trophy',
    52,
    NOW(),
    NOW()
  );

-- =============================================
-- SEED DATA: Plan Features (Relacionamento)
-- =============================================
-- Define quais features cada plano possui

-- PLANO STARTER
INSERT INTO plan_features (plan_id, feature_id, is_enabled, config) VALUES
  -- Comunicação (todas habilitadas)
  ('11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', true, '{}'),
  ('11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111112', true, '{"max_templates": 10}'),
  ('11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111113', true, '{"max_queues": 2}'),

  -- CRM (básico)
  ('11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222221', true, '{}'),
  ('11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', true, '{"max_pipelines": 1}'),
  ('11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222223', false, '{}'), -- Campos customizados OFF
  ('11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222224', false, '{}'), -- Propostas OFF

  -- Automação (limitada)
  ('11111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333331', false, '{}'), -- Workflows OFF
  ('11111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333332', false, '{}'), -- Campanhas OFF
  ('11111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', false, '{}'), -- Chatbot OFF

  -- Analytics (básico)
  ('11111111-1111-1111-1111-111111111111', 'f4444444-4444-4444-4444-444444444441', true, '{}'),
  ('11111111-1111-1111-1111-111111111111', 'f4444444-4444-4444-4444-444444444442', false, '{}'), -- Avançado OFF
  ('11111111-1111-1111-1111-111111111111', 'f4444444-4444-4444-4444-444444444443', false, '{}'), -- Performance OFF

  -- Integrações (limitadas)
  ('11111111-1111-1111-1111-111111111111', 'f5555555-5555-5555-5555-555555555551', false, '{}'), -- API OFF
  ('11111111-1111-1111-1111-111111111111', 'f5555555-5555-5555-5555-555555555552', false, '{}'), -- Webhooks OFF

  -- Admin
  ('11111111-1111-1111-1111-111111111111', 'f6666666-6666-6666-6666-666666666661', false, '{"max_companies": 1}'), -- 1 empresa
  ('11111111-1111-1111-1111-111111111111', 'f6666666-6666-6666-6666-666666666662', false, '{}'), -- White Label OFF
  ('11111111-1111-1111-1111-111111111111', 'f6666666-6666-6666-6666-666666666663', true, '{}');

-- PLANO PROFESSIONAL
INSERT INTO plan_features (plan_id, feature_id, is_enabled, config) VALUES
  -- Comunicação (todas habilitadas)
  ('22222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', true, '{}'),
  ('22222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111112', true, '{"max_templates": 50}'),
  ('22222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111113', true, '{"max_queues": 5}'),

  -- CRM (avançado)
  ('22222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222221', true, '{}'),
  ('22222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222', true, '{"max_pipelines": 5}'),
  ('22222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222223', true, '{"max_custom_fields": 20}'),
  ('22222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222224', true, '{}'),

  -- Automação (habilitada)
  ('22222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333331', true, '{"max_workflows": 10}'),
  ('22222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333332', true, '{"max_campaigns": 20}'),
  ('22222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333', false, '{}'), -- Chatbot OFF (em dev)

  -- Analytics (completo)
  ('22222222-2222-2222-2222-222222222222', 'f4444444-4444-4444-4444-444444444441', true, '{}'),
  ('22222222-2222-2222-2222-222222222222', 'f4444444-4444-4444-4444-444444444442', true, '{}'),
  ('22222222-2222-2222-2222-222222222222', 'f4444444-4444-4444-4444-444444444443', true, '{}'),

  -- Integrações (limitadas)
  ('22222222-2222-2222-2222-222222222222', 'f5555555-5555-5555-5555-555555555551', false, '{}'), -- API OFF
  ('22222222-2222-2222-2222-222222222222', 'f5555555-5555-5555-5555-555555555552', true, '{"max_webhooks": 10}'),

  -- Admin
  ('22222222-2222-2222-2222-222222222222', 'f6666666-6666-6666-6666-666666666661', true, '{"max_companies": 3}'),
  ('22222222-2222-2222-2222-222222222222', 'f6666666-6666-6666-6666-666666666662', false, '{}'), -- White Label OFF
  ('22222222-2222-2222-2222-222222222222', 'f6666666-6666-6666-6666-666666666663', true, '{}');

-- PLANO ENTERPRISE
INSERT INTO plan_features (plan_id, feature_id, is_enabled, config) VALUES
  -- Comunicação (todas habilitadas - ilimitado)
  ('33333333-3333-3333-3333-333333333333', 'f1111111-1111-1111-1111-111111111111', true, '{}'),
  ('33333333-3333-3333-3333-333333333333', 'f1111111-1111-1111-1111-111111111112', true, '{"max_templates": null}'), -- ilimitado
  ('33333333-3333-3333-3333-333333333333', 'f1111111-1111-1111-1111-111111111113', true, '{"max_queues": null}'),

  -- CRM (completo - ilimitado)
  ('33333333-3333-3333-3333-333333333333', 'f2222222-2222-2222-2222-222222222221', true, '{}'),
  ('33333333-3333-3333-3333-333333333333', 'f2222222-2222-2222-2222-222222222222', true, '{"max_pipelines": null}'),
  ('33333333-3333-3333-3333-333333333333', 'f2222222-2222-2222-2222-222222222223', true, '{"max_custom_fields": null}'),
  ('33333333-3333-3333-3333-333333333333', 'f2222222-2222-2222-2222-222222222224', true, '{}'),

  -- Automação (completa - ilimitada)
  ('33333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333331', true, '{"max_workflows": null}'),
  ('33333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333332', true, '{"max_campaigns": null}'),
  ('33333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333333', true, '{}'), -- Chatbot ON

  -- Analytics (avançado - tudo)
  ('33333333-3333-3333-3333-333333333333', 'f4444444-4444-4444-4444-444444444441', true, '{}'),
  ('33333333-3333-3333-3333-333333333333', 'f4444444-4444-4444-4444-444444444442', true, '{}'),
  ('33333333-3333-3333-3333-333333333333', 'f4444444-4444-4444-4444-444444444443', true, '{}'),

  -- Integrações (completas)
  ('33333333-3333-3333-3333-333333333333', 'f5555555-5555-5555-5555-555555555551', true, '{"rate_limit": 10000}'),
  ('33333333-3333-3333-3333-333333333333', 'f5555555-5555-5555-5555-555555555552', true, '{"max_webhooks": null}'),

  -- Admin (tudo habilitado)
  ('33333333-3333-3333-3333-333333333333', 'f6666666-6666-6666-6666-666666666661', true, '{"max_companies": null}'), -- ilimitado
  ('33333333-3333-3333-3333-333333333333', 'f6666666-6666-6666-6666-666666666662', true, '{}'), -- White Label ON
  ('33333333-3333-3333-3333-333333333333', 'f6666666-6666-6666-6666-666666666663', true, '{}');

-- =============================================
-- Comentários e Logs
-- =============================================
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura da plataforma';
COMMENT ON TABLE platform_features IS 'Features controláveis por plano';
COMMENT ON TABLE plan_features IS 'Relacionamento entre planos e features';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data criado com sucesso!';
  RAISE NOTICE '📦 3 planos criados: Starter, Professional, Enterprise';
  RAISE NOTICE '🎯 18 features criadas em 6 categorias';
  RAISE NOTICE '🔗 Features associadas a cada plano com configurações';
END $$;
