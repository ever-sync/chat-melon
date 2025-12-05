-- Add Groq API key to ai_settings table
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS groq_api_key TEXT;

COMMENT ON COLUMN ai_settings.groq_api_key IS 'Chave API do Groq (usa Llama 3.1 70B, muito rápido e gratuito)';
