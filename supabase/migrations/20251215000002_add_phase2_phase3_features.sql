-- =====================================================
-- Adicionar novas features da Fase 2 e 3 ao platform_features
-- =====================================================

-- Knowledge Base (Fase 2)
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES (
  'knowledge_base',
  'Knowledge Base',
  'Base de conhecimento com RAG para respostas inteligentes da IA',
  'ai',
  true,
  'BookOpen',
  28
) ON CONFLICT (feature_key) DO NOTHING;

-- Chatbots (Fase 2)
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES (
  'chatbots',
  'Chatbots',
  'Construtor visual de chatbots com fluxos automatizados',
  'automation',
  true,
  'Bot',
  29
) ON CONFLICT (feature_key) DO NOTHING;

-- Sales Cadences (Fase 3)
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES (
  'cadences',
  'Cadences',
  'Sequências automatizadas de follow-up para prospecção',
  'automation',
  true,
  'GitMerge',
  30
) ON CONFLICT (feature_key) DO NOTHING;

-- Orders / E-commerce (Fase 3)
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES (
  'orders',
  'Pedidos',
  'Gestão de pedidos e mini-loja no chat',
  'marketing',
  true,
  'ShoppingCart',
  31
) ON CONFLICT (feature_key) DO NOTHING;

-- Integrações (Fase 4)
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES (
  'integrations',
  'Integrações',
  'Conecte com Zapier, RD Station, HubSpot e ERPs',
  'automation',
  true,
  'Zap',
  32
) ON CONFLICT (feature_key) DO NOTHING;

-- Segurança (Fase 5)
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES (
  'security',
  'Segurança',
  'SSO, 2FA e logs de auditoria',
  'data',
  true,
  'Shield',
  33
) ON CONFLICT (feature_key) DO NOTHING;
