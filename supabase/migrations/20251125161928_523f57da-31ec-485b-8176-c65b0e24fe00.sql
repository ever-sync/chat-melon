-- ============================================
-- FASE 1: TABELAS DO CRM
-- ============================================

-- 1. PIPELINES E STAGES
-- ============================================

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  order_index INTEGER NOT NULL,
  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,
  automation_rules JSONB DEFAULT '{}'::jsonb,
  probability_default INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEALS (NEGÓCIOS)
-- ============================================

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value DECIMAL(15,2) DEFAULT 0,
  expected_close_date DATE,
  probability INTEGER DEFAULT 50,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'won', 'lost')) DEFAULT 'open',
  lost_reason TEXT,
  products JSONB DEFAULT '[]'::jsonb,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  temperature_score INTEGER DEFAULT 50,
  churn_risk_score INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TAREFAS
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN ('call', 'email', 'meeting', 'follow_up', 'proposal', 'other')) DEFAULT 'follow_up',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUTOS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price DECIMAL(15,2) NOT NULL,
  cost DECIMAL(15,2),
  category TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROPOSTAS
-- ============================================

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'fixed',
  tax DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_terms TEXT,
  validity_days INTEGER DEFAULT 30,
  status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')) DEFAULT 'draft',
  pdf_url TEXT,
  public_link TEXT UNIQUE,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEMPLATES DE MENSAGEM
-- ============================================

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  category TEXT,
  usage_count INTEGER DEFAULT 0,
  avg_response_rate DECIMAL(5,2),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_due ON tasks(assigned_to, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- PIPELINES
DROP POLICY IF EXISTS "Users can view pipelines in their company" ON pipelines;
CREATE POLICY "Users can view pipelines in their company" ON pipelines
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage pipelines" ON pipelines;
CREATE POLICY "Admins can manage pipelines" ON pipelines
  FOR ALL USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- PIPELINE STAGES
DROP POLICY IF EXISTS "Users can view stages in their company" ON pipeline_stages;
CREATE POLICY "Users can view stages in their company" ON pipeline_stages
  FOR SELECT USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE company_id = get_user_company(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage stages" ON pipeline_stages;
CREATE POLICY "Admins can manage stages" ON pipeline_stages
  FOR ALL USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE company_id = get_user_company(auth.uid()) 
      AND has_role(auth.uid(), company_id, 'admin'::app_role)
    )
  );

-- DEALS
DROP POLICY IF EXISTS "Users can view deals in their company" ON deals;
CREATE POLICY "Users can view deals in their company" ON deals
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can create deals in their company" ON deals;
CREATE POLICY "Users can create deals in their company" ON deals
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update deals in their company" ON deals;
CREATE POLICY "Users can update deals in their company" ON deals
  FOR UPDATE USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete deals" ON deals;
CREATE POLICY "Admins can delete deals" ON deals
  FOR DELETE USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- DEAL ACTIVITIES
DROP POLICY IF EXISTS "Users can view activities in their company" ON deal_activities;
CREATE POLICY "Users can view activities in their company" ON deal_activities
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM deals WHERE company_id = get_user_company(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create activities" ON deal_activities;
CREATE POLICY "Users can create activities" ON deal_activities
  FOR INSERT WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE company_id = get_user_company(auth.uid())
    )
  );

-- TASKS
DROP POLICY IF EXISTS "Users can view tasks in their company" ON tasks;
CREATE POLICY "Users can view tasks in their company" ON tasks
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can create tasks in their company" ON tasks;
CREATE POLICY "Users can create tasks in their company" ON tasks
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
CREATE POLICY "Users can update their tasks" ON tasks
  FOR UPDATE USING (
    company_id = get_user_company(auth.uid()) AND
    (assigned_to = auth.uid() OR has_role(auth.uid(), company_id, 'admin'::app_role))
  );

DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;
CREATE POLICY "Admins can delete tasks" ON tasks
  FOR DELETE USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- PRODUCTS
DROP POLICY IF EXISTS "Users can view products in their company" ON products;
CREATE POLICY "Users can view products in their company" ON products
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- PROPOSALS
DROP POLICY IF EXISTS "Users can view proposals in their company" ON proposals;
CREATE POLICY "Users can view proposals in their company" ON proposals
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM deals WHERE company_id = get_user_company(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create proposals" ON proposals;
CREATE POLICY "Users can create proposals" ON proposals
  FOR INSERT WITH CHECK (
    deal_id IN (
      SELECT id FROM deals WHERE company_id = get_user_company(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update proposals" ON proposals;
CREATE POLICY "Users can update proposals" ON proposals
  FOR UPDATE USING (
    deal_id IN (
      SELECT id FROM deals WHERE company_id = get_user_company(auth.uid())
    )
  );

-- MESSAGE TEMPLATES
DROP POLICY IF EXISTS "Users can view templates in their company" ON message_templates;
CREATE POLICY "Users can view templates in their company" ON message_templates
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can create templates in their company" ON message_templates;
CREATE POLICY "Users can create templates in their company" ON message_templates
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update their templates" ON message_templates;
CREATE POLICY "Users can update their templates" ON message_templates
  FOR UPDATE USING (
    company_id = get_user_company(auth.uid()) AND
    (created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin'::app_role))
  );

DROP POLICY IF EXISTS "Admins can delete templates" ON message_templates;
CREATE POLICY "Admins can delete templates" ON message_templates
  FOR DELETE USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
CREATE TRIGGER update_pipelines_updated_at 
  BEFORE UPDATE ON pipelines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at 
  BEFORE UPDATE ON deals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at 
  BEFORE UPDATE ON proposals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS - PIPELINE PADRÃO
-- ============================================

-- Inserir pipeline padrão para cada empresa existente
INSERT INTO pipelines (company_id, name, description, is_default, order_index)
SELECT 
  id,
  'Pipeline de Vendas',
  'Pipeline padrão para gestão de vendas',
  true,
  0
FROM companies
WHERE is_active = true;

-- Inserir stages do pipeline padrão
INSERT INTO pipeline_stages (pipeline_id, name, color, order_index, probability_default, is_closed_won, is_closed_lost)
SELECT 
  p.id,
  stage.name,
  stage.color,
  stage.order_index,
  stage.probability,
  stage.is_won,
  stage.is_lost
FROM pipelines p
CROSS JOIN (
  VALUES 
    ('Novo Lead', '#6B7280', 0, 10, false, false),
    ('Qualificação', '#3B82F6', 1, 25, false, false),
    ('Apresentação', '#8B5CF6', 2, 50, false, false),
    ('Proposta', '#F59E0B', 3, 75, false, false),
    ('Negociação', '#EF4444', 4, 90, false, false),
    ('Fechado Ganho', '#10B981', 5, 100, true, false),
    ('Fechado Perdido', '#EF4444', 6, 0, false, true)
) AS stage(name, color, order_index, probability, is_won, is_lost)
WHERE p.is_default = true;