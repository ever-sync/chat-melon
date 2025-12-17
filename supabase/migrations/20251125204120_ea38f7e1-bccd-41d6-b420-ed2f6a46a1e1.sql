-- Tabela de definição de campos customizados
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'deal', 'company')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email', 'phone', 'currency')),
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, entity_type, field_name)
);

-- Tabela de valores dos campos customizados
CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(custom_field_id, entity_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_company_entity ON custom_fields(company_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_active ON custom_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(custom_field_id);

-- RLS Policies para custom_fields
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view custom fields in their company" ON custom_fields;
CREATE POLICY "Users can view custom fields in their company"
  ON custom_fields FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage custom fields" ON custom_fields;
CREATE POLICY "Admins can manage custom fields"
  ON custom_fields FOR ALL
  USING (has_role(auth.uid(), company_id, 'admin'));

-- RLS Policies para custom_field_values
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view custom field values in their company" ON custom_field_values;
CREATE POLICY "Users can view custom field values in their company"
  ON custom_field_values FOR SELECT
  USING (
    custom_field_id IN (
      SELECT id FROM custom_fields 
      WHERE company_id = get_user_company(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage custom field values in their company" ON custom_field_values;
CREATE POLICY "Users can manage custom field values in their company"
  ON custom_field_values FOR ALL
  USING (
    custom_field_id IN (
      SELECT id FROM custom_fields 
      WHERE company_id = get_user_company(auth.uid())
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_fields_timestamp ON custom_fields;
CREATE TRIGGER update_custom_fields_timestamp
  BEFORE UPDATE ON custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_updated_at();

DROP TRIGGER IF EXISTS update_custom_field_values_timestamp ON custom_field_values;
CREATE TRIGGER update_custom_field_values_timestamp
  BEFORE UPDATE ON custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_updated_at();