-- Migration: Create product_settings table (run this if the previous migration partially failed)
-- ==========================================

-- Drop policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their company product settings" ON public.product_settings;
DROP POLICY IF EXISTS "Users can insert their company product settings" ON public.product_settings;
DROP POLICY IF EXISTS "Users can update their company product settings" ON public.product_settings;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.product_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_name TEXT DEFAULT 'Produto',
  entity_name_plural TEXT DEFAULT 'Produtos',
  entity_icon TEXT DEFAULT 'Package',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to products if they don't exist
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_field_values JSONB DEFAULT '{}';

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

DROP TRIGGER IF EXISTS update_product_settings_timestamp ON public.product_settings;

CREATE TRIGGER update_product_settings_timestamp
  BEFORE UPDATE ON public.product_settings
  FOR EACH ROW EXECUTE FUNCTION update_product_settings_timestamp();
