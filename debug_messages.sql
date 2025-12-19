-- Verificar últimas mensagens com mídia
SELECT
  id,
  content,
  message_type,
  media_type,
  media_url,
  is_from_me,
  created_at,
  LENGTH(media_url) as url_length
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- Verificar se tem URL do storage
SELECT
  id,
  content,
  media_url,
  CASE
    WHEN media_url LIKE '%supabase.co/storage%' THEN 'Supabase Storage ✅'
    WHEN media_url LIKE 'http%' THEN 'URL Externa ⚠️'
    ELSE 'Sem URL ❌'
  END as storage_type
FROM messages
WHERE media_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Verificar arquivos no bucket
SELECT
  name,
  created_at,
  metadata->>'mimetype' as mime_type,
  pg_size_pretty(COALESCE((metadata->>'size')::bigint, 0)) as size
FROM storage.objects
WHERE bucket_id = 'message-media'
ORDER BY created_at DESC
LIMIT 10;
