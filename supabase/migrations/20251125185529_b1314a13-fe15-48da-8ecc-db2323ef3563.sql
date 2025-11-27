-- Adicionar campos icon e description na tabela labels
ALTER TABLE public.labels 
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Inserir labels padrão se não existirem
DO $$
DECLARE
  company_record RECORD;
BEGIN
  -- Para cada empresa ativa, criar labels padrão
  FOR company_record IN 
    SELECT id FROM public.companies WHERE is_active = true
  LOOP
    -- Verificar se já existem labels para esta empresa
    IF NOT EXISTS (SELECT 1 FROM public.labels WHERE company_id = company_record.id) THEN
      INSERT INTO public.labels (company_id, name, color, icon, description) VALUES
        (company_record.id, 'Urgente', '#EF4444', 'AlertCircle', 'Requer atenção imediata'),
        (company_record.id, 'Aguardando Cliente', '#F59E0B', 'Clock', 'Esperando resposta do cliente'),
        (company_record.id, 'Resolvido', '#10B981', 'CheckCircle', 'Problema resolvido com sucesso'),
        (company_record.id, 'Suporte', '#3B82F6', 'HeadphonesIcon', 'Questão técnica ou de suporte'),
        (company_record.id, 'Venda', '#8B5CF6', 'ShoppingCart', 'Oportunidade de venda'),
        (company_record.id, 'Outros', '#6B7280', 'Tag', 'Outros assuntos');
    END IF;
  END LOOP;
END $$;
