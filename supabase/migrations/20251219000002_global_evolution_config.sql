-- =====================================================
-- CONFIGURAÇÃO GLOBAL DA EVOLUTION API
-- =====================================================
-- Uma única configuração para TODAS as instâncias
-- Apenas Super Admin pode alterar

-- Criar tabela de configuração global
CREATE TABLE IF NOT EXISTS public.evolution_global_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Comentários
COMMENT ON TABLE public.evolution_global_config IS 'Configuração global da Evolution API (única para todas as instâncias)';
COMMENT ON COLUMN public.evolution_global_config.api_url IS 'URL base da Evolution API (ex: https://evolution.seudominio.com)';
COMMENT ON COLUMN public.evolution_global_config.api_key IS 'API Key global da Evolution API';
COMMENT ON COLUMN public.evolution_global_config.is_active IS 'Se esta configuração está ativa';

-- Garantir apenas 1 linha ativa por vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_evolution_config_active
ON public.evolution_global_config (is_active)
WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.evolution_global_config ENABLE ROW LEVEL SECURITY;

-- Apenas owners/admins podem ler
CREATE POLICY "Owners and admins can view global evolution config"
ON public.evolution_global_config FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.company_members
    WHERE role IN ('owner', 'admin')
  )
);

-- Apenas owners/admins podem inserir
CREATE POLICY "Owners and admins can insert global evolution config"
ON public.evolution_global_config FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.company_members
    WHERE role IN ('owner', 'admin')
  )
);

-- Apenas owners/admins podem atualizar
CREATE POLICY "Owners and admins can update global evolution config"
ON public.evolution_global_config FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.company_members
    WHERE role IN ('owner', 'admin')
  )
);

-- Service role pode ler (para edge functions)
CREATE POLICY "Service role can view global evolution config"
ON public.evolution_global_config FOR SELECT
USING (auth.role() = 'service_role');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_evolution_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evolution_config_updated_at
BEFORE UPDATE ON public.evolution_global_config
FOR EACH ROW
EXECUTE FUNCTION update_evolution_config_updated_at();

-- Inserir configuração padrão (será atualizada pelo super admin)
INSERT INTO public.evolution_global_config (api_url, api_key, is_active)
VALUES (
  'https://evolution-api.example.com', -- ← Será atualizado pelo super admin
  'YOUR_API_KEY_HERE',                 -- ← Será atualizado pelo super admin
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÃO HELPER: Obter configuração ativa
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_active_evolution_config()
RETURNS TABLE (
  api_url TEXT,
  api_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    egc.api_url,
    egc.api_key
  FROM public.evolution_global_config egc
  WHERE egc.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION public.get_active_evolution_config IS 'Retorna a configuração ativa da Evolution API';

-- Grant para service role (edge functions)
GRANT EXECUTE ON FUNCTION public.get_active_evolution_config() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_active_evolution_config() TO authenticated;
