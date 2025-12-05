-- Add API keys for Gemini and OpenAI to ai_settings table
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

COMMENT ON COLUMN ai_settings.gemini_api_key IS 'Chave API do Google Gemini (gratuito até 1500 req/dia)';
COMMENT ON COLUMN ai_settings.openai_api_key IS 'Chave API da OpenAI (usado como fallback quando Gemini exceder cota)';
