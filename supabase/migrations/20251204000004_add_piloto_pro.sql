-- Add Piloto PRO subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS piloto_pro_subscriber BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS piloto_pro_activated_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.piloto_pro_subscriber IS 'Se o usuário tem assinatura Piloto PRO (IA ilimitada)';
COMMENT ON COLUMN profiles.piloto_pro_activated_at IS 'Data de ativação do Piloto PRO';
