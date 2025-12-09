-- Migration: Create product categories and custom fields
-- ==========================================

-- 1. Tabela de categorias de produtos
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366F1',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, name)
);

-- 2. Tabela de campos customizados para produtos
CREATE TABLE IF NOT EXISTS public.product_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'currency', 'select', 'date', 'boolean', 'textarea')),
  options JSONB, -- Para campos do tipo 'select'
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, name)
);

-- 3. Adicionar colunas à tabela products (se não existirem)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_field_values JSONB DEFAULT '{}';

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_product_categories_company ON public.product_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_product_custom_fields_company ON public.product_custom_fields(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- 5. RLS Policies para product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company categories" ON public.product_categories
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert their company categories" ON public.product_categories
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their company categories" ON public.product_categories
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their company categories" ON public.product_categories
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- 6. RLS Policies para product_custom_fields
ALTER TABLE public.product_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company custom fields" ON public.product_custom_fields
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert their company custom fields" ON public.product_custom_fields
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their company custom fields" ON public.product_custom_fields
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their company custom fields" ON public.product_custom_fields
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- 7. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_product_categories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_categories_timestamp
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION update_product_categories_timestamp();

CREATE OR REPLACE FUNCTION update_product_custom_fields_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_custom_fields_timestamp
  BEFORE UPDATE ON public.product_custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_product_custom_fields_timestamp();

-- 8. Tabela de configurações de produtos
CREATE TABLE IF NOT EXISTS public.product_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_name TEXT DEFAULT 'Produto',
  entity_name_plural TEXT DEFAULT 'Produtos',
  entity_icon TEXT DEFAULT 'Package',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para product_settings
ALTER TABLE public.product_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company product settings" ON public.product_settings
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert their company product settings" ON public.product_settings
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their company product settings" ON public.product_settings
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_product_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_settings_timestamp
  BEFORE UPDATE ON public.product_settings
  FOR EACH ROW EXECUTE FUNCTION update_product_settings_timestamp();
