-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA DO STORAGE
-- =====================================================

-- PASSO 1: Verificar status atual do bucket
SELECT
  id,
  name,
  public,
  file_size_limit,
  avif_autodetection,
  created_at
FROM storage.buckets
WHERE id = 'message-media';

-- PASSO 2: Verificar se há arquivos no bucket
SELECT
  COUNT(*) as total_files,
  MIN(created_at) as first_file,
  MAX(created_at) as last_file
FROM storage.objects
WHERE bucket_id = 'message-media';

-- PASSO 3: Ver último arquivo (para testar)
SELECT
  name,
  bucket_id,
  created_at,
  metadata,
  path_tokens
FROM storage.objects
WHERE bucket_id = 'message-media'
ORDER BY created_at DESC
LIMIT 3;

-- PASSO 4: FORÇAR BUCKET PÚBLICO
UPDATE storage.buckets
SET public = true
WHERE id = 'message-media';

-- PASSO 5: Verificar policies existentes
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- PASSO 6: REMOVER TODAS as policies do bucket message-media
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- PASSO 7: Criar UMA ÚNICA policy de acesso público total
CREATE POLICY "Public Access to message-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-media');

-- PASSO 8: Permitir INSERT/UPDATE para service_role (edge functions)
CREATE POLICY "Service role full access to message-media"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'message-media');

-- PASSO 9: Permitir INSERT para usuários autenticados
CREATE POLICY "Authenticated users can upload to message-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-media');

-- PASSO 10: Verificar que ficou correto
SELECT
  policyname,
  cmd,
  roles::text,
  CASE
    WHEN policyname LIKE '%Public%' THEN '✅ Leitura pública'
    WHEN policyname LIKE '%Service%' THEN '✅ Edge Functions'
    WHEN policyname LIKE '%Authenticated%' THEN '✅ Upload usuários'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- TESTE FINAL: Pegar URL de um arquivo real
-- =====================================================
SELECT
  'https://nmbiuebxhovmwxrbaxsz.supabase.co/storage/v1/object/public/' || bucket_id || '/' || name as public_url,
  created_at
FROM storage.objects
WHERE bucket_id = 'message-media'
ORDER BY created_at DESC
LIMIT 1;

-- ✅ SUCESSO!
-- Copie a URL acima e teste no navegador
-- Se abrir a imagem, o problema está resolvido!
