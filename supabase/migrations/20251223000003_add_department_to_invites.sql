-- Adicionar coluna department_id na tabela company_invites
ALTER TABLE public.company_invites 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_company_invites_department ON public.company_invites(department_id);
