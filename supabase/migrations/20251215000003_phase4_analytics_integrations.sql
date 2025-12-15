-- =====================================================
-- FASE 4: Analytics & Integrações
-- =====================================================

-- =====================================================
-- 4.1 Dashboards Customizáveis
-- =====================================================

-- Dashboards personalizados
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Layout e widgets
  layout JSONB DEFAULT '{"columns": 2}',
  widgets JSONB NOT NULL DEFAULT '[]',
  -- Exemplo de widget:
  -- {
  --   "id": "widget_1",
  --   "type": "metric", -- metric, chart, table, kpi
  --   "title": "Total de Conversas",
  --   "config": {
  --     "source": "conversations",
  --     "aggregation": "count",
  --     "period": "last_30_days",
  --     "filters": {}
  --   },
  --   "position": {"x": 0, "y": 0, "w": 1, "h": 1}
  -- }
  
  -- Permissões
  is_default BOOLEAN DEFAULT false,
  visibility VARCHAR(20) DEFAULT 'private', -- private, team, company
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget templates pré-definidos
CREATE TABLE IF NOT EXISTS dashboard_widget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- metric, chart, table, kpi, funnel
  category VARCHAR(50), -- sales, marketing, support, operations
  
  -- Configuração padrão
  default_config JSONB NOT NULL,
  
  -- Preview
  preview_image_url TEXT,
  
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4.2 Cohort Analysis & Retention
-- =====================================================

-- Tabela de cohorts (gerada por função scheduled)
CREATE TABLE IF NOT EXISTS contact_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Definição do cohort
  cohort_date DATE NOT NULL, -- Mês/semana do primeiro contato
  cohort_type VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly
  
  -- Métricas agregadas
  initial_count INTEGER DEFAULT 0,
  retention_data JSONB DEFAULT '[]',
  -- Exemplo: [
  --   {"period": 0, "active": 100, "rate": 100},
  --   {"period": 1, "active": 75, "rate": 75},
  --   {"period": 2, "active": 60, "rate": 60}
  -- ]
  
  -- Segmentações
  segment VARCHAR(50), -- all, channel_whatsapp, source_organic, etc.
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, cohort_date, cohort_type, segment)
);

-- =====================================================
-- 4.3 Attribution Tracking
-- =====================================================

-- Fontes de atribuição
CREATE TABLE IF NOT EXISTS attribution_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- utm, referrer, direct, campaign, widget
  
  -- Configuração de tracking
  tracking_params JSONB DEFAULT '{}',
  -- Exemplo: {"utm_source": "google", "utm_medium": "cpc", "utm_campaign": "black_friday"}
  
  -- Métricas
  total_contacts INTEGER DEFAULT 0,
  total_deals INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution em contatos
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS attribution_source_id UUID REFERENCES attribution_sources(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS attribution_data JSONB DEFAULT '{}';
-- Exemplo: {"first_touch": {...}, "last_touch": {...}, "utm_params": {...}}

-- Attribution em deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS attribution_source_id UUID REFERENCES attribution_sources(id);

-- =====================================================
-- 4.4-4.7 Integrações Externas
-- =====================================================

-- Configurações de integração
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Tipo de integração
  provider VARCHAR(50) NOT NULL, -- zapier, make, rd_station, hubspot, tiny, bling
  name VARCHAR(100) NOT NULL,
  
  -- Credenciais (criptografadas)
  credentials JSONB DEFAULT '{}',
  
  -- Configurações
  settings JSONB DEFAULT '{}',
  -- Exemplo para Zapier: {"webhook_url": "...", "events": ["deal.created", "contact.created"]}
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, paused, error, disconnected
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Métricas
  total_syncs INTEGER DEFAULT 0,
  successful_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, provider)
);

-- Log de sincronizações
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Detalhes da sync
  direction VARCHAR(10) NOT NULL, -- inbound, outbound
  event_type VARCHAR(100) NOT NULL,
  
  -- Dados
  payload JSONB,
  response JSONB,
  
  -- Status
  status VARCHAR(20) NOT NULL, -- success, error, pending
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- =====================================================
-- Índices
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_custom_dashboards_company ON custom_dashboards(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_cohorts_company ON contact_cohorts(company_id, cohort_date);
CREATE INDEX IF NOT EXISTS idx_attribution_sources_company ON attribution_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_company ON integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration ON integration_sync_logs(integration_id, started_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- Dashboards
DROP POLICY IF EXISTS "Users can manage dashboards from their company" ON custom_dashboards;
CREATE POLICY "Users can manage dashboards from their company" ON custom_dashboards
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Cohorts
DROP POLICY IF EXISTS "Users can view cohorts from their company" ON contact_cohorts;
CREATE POLICY "Users can view cohorts from their company" ON contact_cohorts
  FOR SELECT USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Attribution
DROP POLICY IF EXISTS "Users can manage attribution from their company" ON attribution_sources;
CREATE POLICY "Users can manage attribution from their company" ON attribution_sources
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Integrations
DROP POLICY IF EXISTS "Users can manage integrations from their company" ON integrations;
CREATE POLICY "Users can manage integrations from their company" ON integrations
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Sync Logs
DROP POLICY IF EXISTS "Users can view sync logs from their company" ON integration_sync_logs;
CREATE POLICY "Users can view sync logs from their company" ON integration_sync_logs
  FOR SELECT USING (
    integration_id IN (
      SELECT id FROM integrations WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- Seed Widget Templates
-- =====================================================

INSERT INTO dashboard_widget_templates (name, description, type, category, default_config) VALUES
('Total de Conversas', 'Número total de conversas no período', 'metric', 'support', '{"source": "conversations", "aggregation": "count"}'),
('Conversas por Status', 'Distribuição de conversas por status', 'chart', 'support', '{"source": "conversations", "groupBy": "status", "chartType": "pie"}'),
('Deals por Estágio', 'Funil de vendas', 'funnel', 'sales', '{"source": "deals", "groupBy": "stage_id"}'),
('Receita Total', 'Soma do valor de deals ganhos', 'kpi', 'sales', '{"source": "deals", "aggregation": "sum", "field": "value", "filter": {"status": "won"}}'),
('Novos Contatos', 'Contatos criados por dia', 'chart', 'marketing', '{"source": "contacts", "aggregation": "count", "groupBy": "date", "chartType": "line"}'),
('Taxa de Conversão', 'Percentual de leads convertidos', 'kpi', 'sales', '{"source": "deals", "calculation": "conversion_rate"}'),
('Tempo Médio de Resposta', 'Tempo médio para primeira resposta', 'metric', 'support', '{"source": "conversations", "aggregation": "avg", "field": "first_response_time"}'),
('Top Atendentes', 'Ranking de atendentes por conversas', 'table', 'operations', '{"source": "conversations", "groupBy": "assigned_to", "orderBy": "count", "limit": 10}')
ON CONFLICT DO NOTHING;
