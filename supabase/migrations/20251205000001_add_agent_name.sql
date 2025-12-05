-- Add agent name to ai_settings table
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'Copiloto';

COMMENT ON COLUMN ai_settings.agent_name IS 'Nome do agente de IA que aparece no chat';
