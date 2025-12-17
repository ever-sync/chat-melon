-- Add lead scoring fields to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- Create scoring_rules table
CREATE TABLE IF NOT EXISTS scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL,
  condition_value TEXT,
  points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scoring_rules
DROP POLICY IF EXISTS "Users can view scoring rules in their company" ON scoring_rules;
CREATE POLICY "Users can view scoring rules in their company"
  ON scoring_rules FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage scoring rules" ON scoring_rules;
CREATE POLICY "Admins can manage scoring rules"
  ON scoring_rules FOR ALL
  USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_scoring_rules_company_active ON scoring_rules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON contacts(lead_score DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_scoring_rules_updated_at ON scoring_rules;
CREATE TRIGGER update_scoring_rules_updated_at
  BEFORE UPDATE ON scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default scoring rules for existing companies
INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Tem Email',
  'Contato possui email cadastrado',
  'has_email',
  NULL,
  10
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'has_email'
);

INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Tem Empresa',
  'Contato possui empresa cadastrada',
  'has_company',
  NULL,
  15
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'has_company'
);

INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Resposta Rápida',
  'Respondeu em menos de 1 hora',
  'response_time',
  '60',
  20
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'response_time'
);

INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Engajamento Alto',
  'Mais de 5 mensagens trocadas',
  'messages_count',
  '5',
  10
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'messages_count'
);

INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Tem Deal Aberto',
  'Possui negócio em aberto',
  'has_open_deal',
  NULL,
  30
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'has_open_deal'
);

INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Deal Alto Valor',
  'Deal acima de R$ 5.000',
  'deal_value',
  '5000',
  20
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'deal_value'
);

INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Inativo 7 dias',
  'Sem atividade há mais de 7 dias',
  'days_inactive',
  '7',
  -20
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'days_inactive'
  AND scoring_rules.condition_value = '7'
);

INSERT INTO scoring_rules (company_id, name, description, condition_type, condition_value, points)
SELECT 
  id,
  'Inativo 30 dias',
  'Sem atividade há mais de 30 dias',
  'days_inactive',
  '30',
  -40
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules 
  WHERE scoring_rules.company_id = companies.id 
  AND scoring_rules.condition_type = 'days_inactive'
  AND scoring_rules.condition_value = '30'
);