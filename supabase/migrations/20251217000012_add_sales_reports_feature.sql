-- Add reports_sales feature to platform_features
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES 
  ('reports_sales', 'Dashboard de Vendas', 'Métricas de pipeline e conversão CRM', 'analytics', true, 'TrendingUp', 33)
ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index;

-- Add feature to Full Access Plan (ensure your plan ID matches the one in 000001 migration)
-- Plan ID: 44444444-4444-4444-4444-444444444444
INSERT INTO plan_features (plan_id, feature_id, is_enabled, config)
SELECT
  '44444444-4444-4444-4444-444444444444'::uuid,
  id,
  true,
  '{}'::jsonb
FROM platform_features
WHERE feature_key = 'reports_sales'
ON CONFLICT (plan_id, feature_id) DO UPDATE SET
  is_enabled = true;
