-- Verificar se existem deals
SELECT COUNT(*) as total_deals FROM deals;

-- Verificar se existem atividades
SELECT COUNT(*) as total_activities FROM deal_activities;

-- Ver detalhes das atividades existentes
SELECT
  da.id,
  da.deal_id,
  da.activity_type,
  da.description,
  da.created_at,
  d.title as deal_title
FROM deal_activities da
JOIN deals d ON d.id = da.deal_id
ORDER BY da.created_at DESC
LIMIT 10;

-- Verificar triggers existentes
SELECT
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'deals'::regclass
  AND tgisinternal = false;
