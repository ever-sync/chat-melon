-- Migration to create company variables table
CREATE TABLE IF NOT EXISTS public.company_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, key)
);

-- Enable RLS
ALTER TABLE public.company_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view variables from their company" ON public.company_variables;
CREATE POLICY "Users can view variables from their company"
    ON public.company_variables FOR SELECT
    USING (
        company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid() AND company_id = company_variables.company_id)
    );

DROP POLICY IF EXISTS "Admins can manage variables from their company" ON public.company_variables;
CREATE POLICY "Admins can manage variables from their company"
    ON public.company_variables FOR ALL
    USING (
        company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid() AND company_id = company_variables.company_id)
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_variables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_variables_timestamp ON public.company_variables;
CREATE TRIGGER update_company_variables_timestamp
    BEFORE UPDATE ON public.company_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_company_variables_updated_at();

-- Add index
CREATE INDEX IF NOT EXISTS idx_company_variables_company ON public.company_variables(company_id);
