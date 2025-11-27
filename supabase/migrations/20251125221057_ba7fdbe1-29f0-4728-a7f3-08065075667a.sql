-- Create proposal_templates table
CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their company"
  ON proposal_templates FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can create templates in their company"
  ON proposal_templates FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can update templates in their company"
  ON proposal_templates FOR UPDATE
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can delete templates"
  ON proposal_templates FOR DELETE
  USING (
    company_id = get_user_company(auth.uid()) 
    AND has_role(auth.uid(), company_id, 'admin'::app_role)
  );

-- Create index for company_id
CREATE INDEX idx_proposal_templates_company_id ON proposal_templates(company_id);

-- Create index for category
CREATE INDEX idx_proposal_templates_category ON proposal_templates(category) WHERE category IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_proposal_templates_updated_at
  BEFORE UPDATE ON proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO proposal_templates (company_id, name, description, category, is_default, content, created_by)
SELECT 
  c.id,
  'Proposta Comercial Padrão',
  'Template básico para propostas comerciais',
  'vendas',
  true,
  '{
    "sections": [
      {
        "type": "header",
        "title": "Proposta Comercial",
        "subtitle": "{{empresa_cliente}}"
      },
      {
        "type": "text",
        "title": "Apresentação",
        "content": "Prezado(a) {{nome_contato}},\n\nApresentamos nossa proposta comercial para atender às necessidades da {{empresa_cliente}}."
      },
      {
        "type": "products",
        "title": "Produtos e Serviços",
        "show_images": true
      },
      {
        "type": "pricing",
        "title": "Investimento",
        "show_discount": true
      },
      {
        "type": "terms",
        "title": "Condições Comerciais",
        "content": "• Validade da proposta: {{validade}} dias\n• Forma de pagamento: Conforme negociado\n• Prazo de entrega: A combinar"
      },
      {
        "type": "signature",
        "title": "Aceite"
      }
    ],
    "styles": {
      "primaryColor": "#3B82F6",
      "fontFamily": "Inter"
    }
  }'::jsonb,
  c.created_by
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM proposal_templates pt WHERE pt.company_id = c.id
);