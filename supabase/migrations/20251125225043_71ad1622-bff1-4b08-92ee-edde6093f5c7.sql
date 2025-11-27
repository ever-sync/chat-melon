-- Adicionar campos de saúde e limites às instâncias
ALTER TABLE evolution_settings ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 1000;
ALTER TABLE evolution_settings ADD COLUMN IF NOT EXISTS messages_sent_today INTEGER DEFAULT 0;
ALTER TABLE evolution_settings ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE evolution_settings ADD COLUMN IF NOT EXISTS delivery_rate DECIMAL(5,2) DEFAULT 100.0;
ALTER TABLE evolution_settings ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0.0;
ALTER TABLE evolution_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Adicionar campos de horário comercial às campanhas
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS business_hours_only BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS business_hours_start TIME DEFAULT '09:00';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS business_hours_end TIME DEFAULT '18:00';

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_evolution_settings_daily_limit ON evolution_settings(last_reset_date, messages_sent_today);