-- Add copilot_script column to ai_settings table
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS copilot_script TEXT;

COMMENT ON COLUMN ai_settings.copilot_script IS 'Script de vendas/diretrizes para o Copiloto (Assistente Amarelo)';
