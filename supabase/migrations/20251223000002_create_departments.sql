-- Criar tabela de setores/departamentos
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  
  -- Horário de funcionamento
  working_hours JSONB DEFAULT '{
    "monday": {"start": "08:30", "end": "17:30", "enabled": true, "is_24h": false},
    "tuesday": {"start": "08:30", "end": "17:30", "enabled": true, "is_24h": false},
    "wednesday": {"start": "08:30", "end": "17:30", "enabled": true, "is_24h": false},
    "thursday": {"start": "08:30", "end": "17:30", "enabled": true, "is_24h": false},
    "friday": {"start": "08:30", "end": "17:30", "enabled": true, "is_24h": false},
    "saturday": {"start": "00:00", "end": "23:59", "enabled": false, "is_24h": false},
    "sunday": {"start": "00:00", "end": "23:59", "enabled": false, "is_24h": false}
  }'::jsonb,
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  show_in_menu BOOLEAN DEFAULT true,
  allow_view_all_contacts BOOLEAN DEFAULT false,
  auto_assign_leads BOOLEAN DEFAULT false,
  welcome_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, name)
);

-- Adicionar coluna department_id em company_members se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_members' 
    AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.company_members 
    ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_departments_company ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);
CREATE INDEX IF NOT EXISTS idx_company_members_department ON public.company_members(department_id);

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para departments
DROP POLICY IF EXISTS "Users can view departments in their company" ON public.departments;
CREATE POLICY "Users can view departments in their company"
  ON public.departments FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE user_id = auth.uid() 
      AND company_id = departments.company_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_departments_updated_at ON public.departments;
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns setores padrão para empresas existentes
INSERT INTO public.departments (company_id, name, color, description)
SELECT 
  c.id,
  'COMERCIAL',
  '#10b981',
  'Setor comercial e vendas'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.company_id = c.id AND d.name = 'COMERCIAL'
)
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.departments (company_id, name, color, description)
SELECT 
  c.id,
  'COMERCIAL PÓS',
  '#3b82f6',
  'Pós-vendas e suporte'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.company_id = c.id AND d.name = 'COMERCIAL PÓS'
)
ON CONFLICT (company_id, name) DO NOTHING;

INSERT INTO public.departments (company_id, name, color, description)
SELECT 
  c.id,
  'PÓS VENDA',
  '#8b5cf6',
  'Atendimento pós-venda'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d 
  WHERE d.company_id = c.id AND d.name = 'PÓS VENDA'
)
ON CONFLICT (company_id, name) DO NOTHING;
