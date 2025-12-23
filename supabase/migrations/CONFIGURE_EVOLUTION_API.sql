-- =====================================================
-- CONFIGURAR EVOLUTION API GLOBAL
-- =====================================================

-- Atualizar com SUA URL e API KEY
UPDATE evolution_global_config
SET
  api_url = 'https://api.eversync.com.br',
  api_key = 'd2a0995484bd8fd1039d9a119c7c39e4',
  updated_at = NOW()
WHERE is_active = true;

-- Verificar configuração
SELECT
  id,
  api_url,
  LEFT(api_key, 10) || '...' as api_key_preview,
  is_active,
  created_at,
  updated_at
FROM evolution_global_config
WHERE is_active = true;

-- Sucesso! ✅
-- Agora todas as instâncias usarão:
-- URL: https://api.eversync.com.br
-- API Key: d2a0995484bd8fd1039d9a119c7c39e4
