-- =============================================
-- Sistema de Landing Pages com IA
-- =============================================

-- Tabela para armazenar chaves de API de IA por empresa
CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'claude', 'gemini', 'openai', 'custom'
  api_key TEXT NOT NULL, -- Criptografado
  model_name VARCHAR(100), -- ex: 'claude-3-5-sonnet-20241022', 'gemini-pro', 'gpt-4'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,

  UNIQUE(company_id, provider)
);

-- Tabela de templates base para landing pages
CREATE TABLE IF NOT EXISTS landing_page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'product', 'service', 'event', 'lead-capture', 'thank-you'
  thumbnail_url TEXT,
  html_structure JSONB NOT NULL, -- Estrutura de blocos do template
  is_public BOOLEAN DEFAULT true,
  company_id UUID REFERENCES companies(id), -- NULL = template público
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal de landing pages
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL, -- URL amigável
  description TEXT,

  -- Configuração de geração
  generation_prompt TEXT, -- Prompt usado para gerar a página
  ai_provider VARCHAR(50), -- Provedor de IA usado
  template_id UUID REFERENCES landing_page_templates(id),

  -- Conteúdo
  html_content TEXT NOT NULL,
  css_content TEXT,
  js_content TEXT,
  meta_tags JSONB, -- SEO: title, description, keywords, og:tags

  -- Configuração de formulário
  form_config JSONB, -- Campos do formulário, validações, ações

  -- Publicação
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMP WITH TIME ZONE,
  custom_domain VARCHAR(255), -- Domínio personalizado

  -- Analytics
  views_count INTEGER DEFAULT 0,
  submissions_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,

  UNIQUE(company_id, slug)
);

-- Tabela de blocos/seções da landing page
CREATE TABLE IF NOT EXISTS landing_page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  block_type VARCHAR(100) NOT NULL, -- 'hero', 'features', 'testimonials', 'cta', 'form', 'footer'
  order_index INTEGER NOT NULL,
  content JSONB NOT NULL, -- Conteúdo específico do bloco
  styles JSONB, -- Estilos customizados
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de submissões de formulários
CREATE TABLE IF NOT EXISTS landing_page_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Dados do lead
  form_data JSONB NOT NULL, -- Dados enviados no formulário
  contact_id UUID REFERENCES contacts(id), -- Link com contato criado

  -- Tracking
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  utm_params JSONB, -- utm_source, utm_medium, utm_campaign, etc.

  -- Ações automáticas
  actions_triggered JSONB, -- Ações executadas (email, whatsapp, automação)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de analytics de landing pages
CREATE TABLE IF NOT EXISTS landing_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'scroll', 'form_start', 'form_submit'
  event_data JSONB,

  -- Tracking
  session_id UUID,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  utm_params JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de gerações com IA
CREATE TABLE IF NOT EXISTS landing_page_ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,

  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10,4), -- Custo estimado
  generation_time_ms INTEGER,

  status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- Índices para performance
CREATE INDEX idx_landing_pages_company ON landing_pages(company_id);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);
CREATE INDEX idx_landing_page_blocks_page ON landing_page_blocks(landing_page_id);
CREATE INDEX idx_landing_page_submissions_page ON landing_page_submissions(landing_page_id);
CREATE INDEX idx_landing_page_submissions_company ON landing_page_submissions(company_id);
CREATE INDEX idx_landing_page_analytics_page ON landing_page_analytics(landing_page_id);
CREATE INDEX idx_landing_page_analytics_created ON landing_page_analytics(created_at);
CREATE INDEX idx_ai_provider_keys_company ON ai_provider_keys(company_id);

-- RLS Policies
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_ai_generations ENABLE ROW LEVEL SECURITY;

-- Policies para ai_provider_keys
CREATE POLICY "Users can view their organization's AI keys"
  ON ai_provider_keys FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage AI keys"
  ON ai_provider_keys FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Policies para landing_pages
CREATE POLICY "Users can view their organization's landing pages"
  ON landing_pages FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage landing pages"
  ON landing_pages FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Policies para landing_page_blocks
CREATE POLICY "Users can view blocks from their organization's pages"
  ON landing_page_blocks FOR SELECT
  USING (
    landing_page_id IN (
      SELECT id FROM landing_pages
      WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage blocks"
  ON landing_page_blocks FOR ALL
  USING (
    landing_page_id IN (
      SELECT id FROM landing_pages
      WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
      )
    )
  );

-- Policies para landing_page_submissions
CREATE POLICY "Users can view their organization's submissions"
  ON landing_page_submissions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

-- Policies para landing_page_analytics
CREATE POLICY "Users can view their organization's analytics"
  ON landing_page_analytics FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

-- Policies para landing_page_ai_generations
CREATE POLICY "Users can view their organization's AI generations"
  ON landing_page_ai_generations FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

-- Policies para templates (públicos ou da organização)
CREATE POLICY "Anyone can view public templates"
  ON landing_page_templates FOR SELECT
  USING (is_public = true OR company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their company's templates"
  ON landing_page_templates FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Funções úteis
CREATE OR REPLACE FUNCTION update_landing_page_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_type = 'view' THEN
      UPDATE landing_pages
      SET views_count = views_count + 1
      WHERE id = NEW.landing_page_id;
    ELSIF NEW.event_type = 'form_submit' THEN
      UPDATE landing_pages
      SET submissions_count = submissions_count + 1,
          conversion_rate = CASE
            WHEN views_count > 0 THEN ((submissions_count + 1)::DECIMAL / views_count::DECIMAL) * 100
            ELSE 0
          END
      WHERE id = NEW.landing_page_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_landing_page_stats
  AFTER INSERT ON landing_page_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_stats();

-- Inserir templates base
INSERT INTO landing_page_templates (name, description, category, is_public, html_structure) VALUES
('Lead Capture Simples', 'Template minimalista para captura de leads com formulário centralizado', 'lead-capture', true, '{
  "blocks": [
    {"type": "hero", "order": 1},
    {"type": "form", "order": 2},
    {"type": "footer", "order": 3}
  ]
}'::jsonb),

('Produto/Serviço Completo', 'Template completo para apresentar produtos ou serviços com features e depoimentos', 'product', true, '{
  "blocks": [
    {"type": "hero", "order": 1},
    {"type": "features", "order": 2},
    {"type": "testimonials", "order": 3},
    {"type": "cta", "order": 4},
    {"type": "form", "order": 5},
    {"type": "footer", "order": 6}
  ]
}'::jsonb),

('Evento/Webinar', 'Template para divulgação de eventos e webinars com countdown e inscrição', 'event', true, '{
  "blocks": [
    {"type": "hero", "order": 1},
    {"type": "countdown", "order": 2},
    {"type": "benefits", "order": 3},
    {"type": "speakers", "order": 4},
    {"type": "form", "order": 5},
    {"type": "footer", "order": 6}
  ]
}'::jsonb),

('Thank You Page', 'Página de agradecimento após conversão', 'thank-you', true, '{
  "blocks": [
    {"type": "hero", "order": 1},
    {"type": "next-steps", "order": 2},
    {"type": "social-share", "order": 3},
    {"type": "footer", "order": 4}
  ]
}'::jsonb);

-- Comentários
COMMENT ON TABLE ai_provider_keys IS 'Chaves de API de provedores de IA configuradas por cada empresa';
COMMENT ON TABLE landing_page_templates IS 'Templates base para criação de landing pages';
COMMENT ON TABLE landing_pages IS 'Landing pages criadas pelas empresas';
COMMENT ON TABLE landing_page_blocks IS 'Blocos/seções que compõem cada landing page';
COMMENT ON TABLE landing_page_submissions IS 'Submissões de formulários das landing pages';
COMMENT ON TABLE landing_page_analytics IS 'Analytics detalhados de cada landing page';
COMMENT ON TABLE landing_page_ai_generations IS 'Histórico de gerações com IA';
