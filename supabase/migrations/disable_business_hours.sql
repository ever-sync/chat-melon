-- Desabilitar business_hours_only para permitir widget funcionar 24/7
-- Execute isso no seu Supabase SQL Editor

UPDATE widget_settings
SET business_hours_only = false
WHERE enabled = true;

-- Para verificar se funcionou:
SELECT
  company_id,
  enabled,
  business_hours_only,
  primary_color,
  greeting_title
FROM widget_settings;
