-- ============================================
-- EVOLUTION API CONFIGURATION
-- ============================================
-- Adiciona campos de configuração da Evolution API na tabela companies

-- 1. Adicionar colunas de configuração
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS evolution_api_url TEXT,
ADD COLUMN IF NOT EXISTS evolution_api_key TEXT,
ADD COLUMN IF NOT EXISTS evolution_instance_name TEXT;

-- 2. Adicionar colunas de status e sincronização
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS evolution_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS evolution_qr_code TEXT,
ADD COLUMN IF NOT EXISTS evolution_last_sync TIMESTAMPTZ;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_companies_evolution_instance
ON companies(evolution_instance_name)
WHERE evolution_instance_name IS NOT NULL;

-- 4. Comentários
COMMENT ON COLUMN companies.evolution_api_url IS 'URL base da API Evolution (ex: https://api.evolutionapi.com)';
COMMENT ON COLUMN companies.evolution_api_key IS 'Chave de autenticação da API Evolution';
COMMENT ON COLUMN companies.evolution_instance_name IS 'Nome da instância WhatsApp na Evolution API';
COMMENT ON COLUMN companies.evolution_connected IS 'Indica se a instância está conectada ao WhatsApp';
COMMENT ON COLUMN companies.evolution_qr_code IS 'QR Code base64 para conexão (temporário)';
COMMENT ON COLUMN companies.evolution_last_sync IS 'Última sincronização com a Evolution API';
