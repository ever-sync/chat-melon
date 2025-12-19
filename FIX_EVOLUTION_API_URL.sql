-- =====================================================
-- CORRIGIR API_URL DA EVOLUTION API
-- =====================================================

-- IMPORTANTE: Substitua pela URL REAL da sua Evolution API!
-- Exemplo: https://evolution.seudominio.com ou http://ip:porta

UPDATE evolution_settings
SET
  api_url = 'SUA_URL_AQUI',  -- ← COLE A URL DA SUA EVOLUTION API AQUI
  api_key = 'SUA_API_KEY_AQUI'  -- ← COLE A API KEY AQUI (se tiver)
WHERE instance_name = 'RaphaelSantos';

-- Verificar
SELECT
  id,
  instance_name,
  api_url,
  api_key,
  is_connected
FROM evolution_settings
WHERE instance_name = 'RaphaelSantos';
