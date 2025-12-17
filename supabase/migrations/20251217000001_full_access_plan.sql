-- =====================================================
-- COMPREHENSIVE FEATURE CATALOG & FULL ACCESS PLAN
-- =====================================================
-- This script ensures all features exist in platform_features
-- and creates a "Full Access" plan with ALL features enabled
--
-- Run this AFTER all other migrations
-- =====================================================

-- =====================================================
-- STEP 1: Ensure ALL Features Exist
-- =====================================================
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES 
  -- Communication & Core
  ('chat', 'Conversas', 'Interface principal de chat WhatsApp', 'communication', true, 'MessageSquare', 1),
  ('quick_replies', 'Respostas Rápidas', 'Templates de mensagens pré-configuradas', 'communication', true, 'Zap', 2),
  ('queues', 'Filas', 'Sistema de distribuição de conversas', 'communication', true, 'ListOrdered', 3),
  ('groups', 'Grupos', 'Gerenciamento de grupos do WhatsApp', 'communication', true, 'UsersRound', 4),
  ('contacts', 'Contatos', 'Gestão e organização de contatos', 'crm', true, 'Users', 5),
  
  -- CRM & Sales
  ('deals_pipeline', 'CRM (Pipeline)', 'Funil de vendas com Kanban', 'crm', true, 'TrendingUp', 6),
  ('custom_fields', 'Campos Customizados', 'Campos personalizados para contatos e deals', 'crm', true, 'Settings', 7),
  ('proposals', 'Propostas', 'Geração de propostas e orçamentos', 'crm', true, 'FileText', 8),
  ('products', 'Produtos', 'Catálogo de produtos', 'crm', true, 'Package', 9),
  ('orders', 'Pedidos', 'Gestão de pedidos e e-commerce', 'crm', true, 'ShoppingBag', 10),
  ('cadences', 'Cadências', 'Sequências automatizadas de follow-up', 'sales', true, 'GitMerge', 11),
  ('segments', 'Segmentos', 'Segmentação avançada de contatos', 'crm', true, 'Filter', 12),
  ('duplicates', 'Duplicados', 'Detecção e merge de duplicatas', 'crm', true, 'Copy', 13),
  
  -- Automation & AI
  ('workflows', 'Automações (Workflows)', 'Criação de automações visuais', 'automation', true, 'Workflow', 20),
  ('campaigns', 'Campanhas', 'Envio em massa com segmentação', 'automation', true, 'Send', 21),
  ('chatbot', 'Chatbot (Legacy)', 'Chatbot com IA (versão antiga)', 'automation', true, 'Bot', 22),
  ('chatbots', 'Chatbots', 'Construtor visual de chatbots', 'automation', true, 'Bot', 23),
  ('ai_assistant', 'Assistente IA', 'Sugestões inteligentes de respostas', 'automation', true, 'Sparkles', 24),
  ('knowledge_base', 'Knowledge Base', 'Base de conhecimento com RAG para IA', 'automation', true, 'BookOpen', 25),
  
  -- Analytics & Reports
  ('reports_basic', 'Relatórios Básicos', 'Dashboards e métricas essenciais', 'analytics', true, 'BarChart', 30),
  ('reports_advanced', 'Relatórios Avançados', 'Análises detalhadas e exportação', 'analytics', true, 'LineChart', 31),
  ('team_performance', 'Performance de Time', 'Métricas individuais por agente', 'analytics', true, 'Users', 32),
  
  -- Integrations & API
  ('api_public', 'API Pública', 'Acesso programático via REST API', 'integration', true, 'Code', 40),
  ('webhooks', 'Webhooks', 'Notificações em tempo real de eventos', 'integration', true, 'Webhook', 41),
  ('integrations', 'Integrações', 'Conecte com terceiros (Zapier, HubSpot...)', 'integration', true, 'Zap', 42),
  ('channels', 'Canais', 'Gerenciamento multi-canal (Instagram, Messenger...)', 'integration', true, 'MessageCircle', 43),
  
  -- Tools & Content
  ('faq', 'FAQ', 'Gerenciamento de perguntas frequentes', 'content', true, 'HelpCircle', 50),
  ('documents', 'Documentos', 'Armazenamento de documentos internos', 'content', true, 'FileText', 51),
  
  -- Administration
  ('multi_company', 'Multi-Empresa', 'Gerenciar múltiplas empresas', 'admin', true, 'Building', 60),
  ('white_label', 'White Label', 'Personalização completa da marca', 'admin', true, 'Palette', 61),
  ('gamification', 'Gamificação', 'Sistema de pontos e conquistas', 'admin', true, 'Trophy', 62),
  ('security', 'Segurança', 'SSO, 2FA e logs de auditoria', 'admin', true, 'Shield', 63)

ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();

-- =====================================================
-- STEP 2: Create "Full Access" / "Completo" Plan
-- =====================================================
INSERT INTO subscription_plans (
  id,
  slug,
  name,
  price_monthly,
  price_yearly,
  max_companies,
  max_users,
  max_conversations,
  features,
  created_at,
  updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  'full',
  'Full Access',
  0.00, -- Free for testing or custom pricing
  0.00,
  NULL, -- Unlimited
  NULL, -- Unlimited
  NULL, -- Unlimited
  '{"all_features": true}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- =====================================================
-- STEP 3: Link ALL Features to Full Access Plan
-- =====================================================
-- This uses a dynamic INSERT based on what exists in platform_features
INSERT INTO plan_features (plan_id, feature_id, is_enabled, config)
SELECT 
  '44444444-4444-4444-4444-444444444444'::uuid,
  id,
  true,
  '{}'::jsonb
FROM platform_features
WHERE is_global_enabled = true
ON CONFLICT (plan_id, feature_id) DO UPDATE SET
  is_enabled = true,
  updated_at = NOW();

-- =====================================================
-- Success Message
-- =====================================================
DO $$
DECLARE
  feature_count INT;
BEGIN
  SELECT COUNT(*) INTO feature_count FROM platform_features WHERE is_global_enabled = true;
  RAISE NOTICE '✅ Full Access Plan criado com sucesso!';
  RAISE NOTICE '📦 Total de % features habilitadas', feature_count;
END $$;
