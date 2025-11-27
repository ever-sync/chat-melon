-- Criar tabela de segmentos
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_count INTEGER DEFAULT 0,
  is_dynamic BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_segments_company_id ON segments(company_id);
CREATE INDEX idx_segments_created_by ON segments(created_by);
CREATE INDEX idx_segments_filters ON segments USING GIN(filters);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view segments in their company"
  ON segments FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can create segments in their company"
  ON segments FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can update segments in their company"
  ON segments FOR UPDATE
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can delete segments in their company"
  ON segments FOR DELETE
  USING (company_id = get_user_company(auth.uid()));