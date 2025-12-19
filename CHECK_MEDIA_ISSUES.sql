-- =====================================================
-- DIAGNÓSTICO COMPLETO DE PROBLEMAS COM MÍDIAS
-- =====================================================

-- 1. Verificar se bucket existe
SELECT
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id = 'message-media';
-- Deve retornar 1 linha com public = true

-- 2. Verificar últimas mensagens (com e sem mídia)
SELECT
  id,
  content,
  message_type,
  media_type,
  CASE
    WHEN media_url LIKE '%supabase.co/storage%' THEN '✅ Supabase Storage'
    WHEN media_url LIKE 'http%' THEN '⚠️ URL Externa'
    WHEN media_url IS NULL THEN '❌ Sem URL'
    ELSE '❓ Formato Desconhecido'
  END as storage_type,
  LEFT(media_url, 60) as media_url_preview,
  is_from_me,
  created_at
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Verificar arquivos no bucket
SELECT
  COUNT(*) as total_arquivos,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as tamanho_total
FROM storage.objects
WHERE bucket_id = 'message-media';

-- 4. Ver últimos arquivos no bucket
SELECT
  name,
  created_at,
  metadata->>'mimetype' as mime_type,
  metadata->>'size' as size_bytes
FROM storage.objects
WHERE bucket_id = 'message-media'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar políticas RLS do bucket
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- 6. Verificar conversas com mídias
SELECT
  c.id as conversation_id,
  c.contact_name,
  c.last_message,
  COUNT(m.id) FILTER (WHERE m.media_url IS NOT NULL) as total_midias,
  MAX(m.created_at) FILTER (WHERE m.media_url IS NOT NULL) as ultima_midia
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.updated_at > NOW() - INTERVAL '1 hour'
GROUP BY c.id, c.contact_name, c.last_message
ORDER BY c.updated_at DESC
LIMIT 10;

-- 7. Verificar se mensagens têm media_type preenchido
SELECT
  media_type,
  COUNT(*) as total
FROM messages
WHERE media_url IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY media_type
ORDER BY total DESC;

-- 8. Testar URL de mídia (pegar uma das últimas)
SELECT
  id,
  content,
  media_type,
  media_url,
  created_at
FROM messages
WHERE media_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
-- Copie a media_url e teste no navegador

-- 9. Verificar configuração Evolution API
SELECT
  id,
  company_id,
  instance_name,
  is_connected,
  instance_status,
  qr_code IS NOT NULL as has_qr_code,
  api_url,
  created_at
FROM evolution_settings
ORDER BY created_at DESC
LIMIT 5;

-- 10. Verificar logs de webhook (se tiver tabela)
SELECT
  event_type,
  status,
  payload->>'event' as event_name,
  created_at
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
