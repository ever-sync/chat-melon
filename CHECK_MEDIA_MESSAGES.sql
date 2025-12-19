-- =====================================================
-- VERIFICAR MENSAGENS COM MÍDIA
-- =====================================================

-- Ver últimas mensagens com mídia
SELECT
  id,
  content,
  media_url,
  media_type,
  created_at,
  LENGTH(media_url) as url_length,
  SUBSTRING(media_url FROM 1 FOR 100) as url_preview
FROM messages
WHERE media_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Ver se há mensagens com media_url mas sem media_type
SELECT COUNT(*) as count_missing_type
FROM messages
WHERE media_url IS NOT NULL AND media_type IS NULL;

-- Ver distribuição de tipos de mídia
SELECT
  media_type,
  COUNT(*) as count
FROM messages
WHERE media_url IS NOT NULL
GROUP BY media_type
ORDER BY count DESC;
