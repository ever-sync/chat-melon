-- ============================================
-- Migração: Remover api_url e api_key da tabela evolution_settings
-- ============================================
-- Agora as credenciais são globais (EVOLUTION_API_URL e EVOLUTION_API_KEY)
-- Clientes só precisam criar instância e conectar via QR Code

-- Tornar api_url e api_key nullable (migração gradual)
ALTER TABLE evolution_settings 
ALTER COLUMN api_url DROP NOT NULL,
ALTER COLUMN api_key DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON TABLE evolution_settings IS 'Configurações de instâncias WhatsApp. api_url e api_key são opcionais pois agora usamos segredos globais EVOLUTION_API_URL e EVOLUTION_API_KEY';