-- Add instance_settings column to evolution_settings table
ALTER TABLE evolution_settings ADD COLUMN IF NOT EXISTS instance_settings JSONB DEFAULT '{}'::jsonb;
