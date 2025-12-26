-- Add Marketing feature to platform_features table
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES (
  'marketing',
  'Marketing',
  'Ferramentas e recursos para campanhas de marketing',
  'business',
  true,
  'Target',
  125
)
ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_global_enabled = EXCLUDED.is_global_enabled;
