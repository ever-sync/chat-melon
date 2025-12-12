-- ============================================
-- ADICIONAR FEATURES FALTANTES NO PLATFORM_FEATURES
-- ============================================

-- Inserir features que podem estar faltando (usando ON CONFLICT para evitar duplicatas)
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, order_index)
VALUES 
  ('chat', 'Chat WhatsApp', 'Integração com WhatsApp via Evolution API', 'communication', true, 1),
  ('quick_replies', 'Respostas Rápidas', 'Templates de mensagens pré-configuradas', 'communication', true, 2),
  ('queues', 'Filas de Atendimento', 'Sistema de distribuição de conversas', 'communication', true, 3),
  ('products', 'Produtos', 'Gerenciamento de produtos e catálogo', 'core', true, 4),
  ('contacts', 'Gestão de Contatos', 'Cadastro e organização de contatos', 'crm', true, 5),
  ('deals_pipeline', 'Pipeline de Vendas', 'Funil de vendas com Kanban', 'crm', true, 6),
  ('custom_fields', 'Campos Customizados', 'Crie campos personalizados para contatos e deals', 'crm', true, 7),
  ('proposals', 'Propostas Comerciais', 'Geração de propostas e orçamentos', 'crm', true, 8),
  ('faq', 'FAQ', 'Gerenciamento de perguntas frequentes com categorias', 'content', true, 9),
  ('documents', 'Documentos', 'Gerenciamento de documentos da empresa', 'content', true, 10),
  ('workflows', 'Workflows Visuais', 'Criação de automações com drag & drop', 'automation', true, 11),
  ('campaigns', 'Campanhas de Mensagens', 'Envio em massa com segmentação', 'automation', true, 12),
  ('chatbot', 'Chatbot com IA', 'Atendimento automatizado com inteligência artificial', 'automation', true, 13),
  ('reports_basic', 'Relatórios Básicos', 'Dashboards e métricas essenciais', 'analytics', true, 14),
  ('reports_advanced', 'Relatórios Avançados', 'Análises detalhadas e exportação de dados', 'analytics', true, 15),
  ('team_performance', 'Performance da Equipe', 'Métricas individuais por agente', 'analytics', true, 16),
  ('api_public', 'API Pública', 'Acesso programático via REST API', 'integration', true, 17),
  ('webhooks', 'Webhooks', 'Notificações em tempo real de eventos', 'integration', true, 18),
  ('multi_company', 'Multi-Empresa', 'Gerenciar múltiplas empresas em uma conta', 'admin', true, 19),
  ('white_label', 'White Label', 'Personalização completa da marca', 'admin', true, 20),
  ('gamification', 'Gamificação', 'Sistema de pontos e conquistas para equipe', 'admin', true, 21),
  ('groups', 'Grupos', 'Gerenciamento de grupos do WhatsApp', 'communication', true, 22),
  ('segments', 'Segmentos', 'Segmentação avançada de contatos', 'crm', true, 23),
  ('duplicates', 'Duplicados', 'Detecção e merge de contatos duplicados', 'crm', true, 24),
  ('ai_assistant', 'Assistente IA', 'Sugestões inteligentes de respostas', 'automation', true, 25),
  ('automation', 'Automações', 'Automação de fluxos de trabalho', 'automation', true, 26)
ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_global_enabled = true;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Todas as features foram adicionadas/atualizadas com sucesso!';
END $$;
