-- =====================================================
-- FORÇAR BUCKET PÚBLICO (MODO AGRESSIVO)
-- =====================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Forçar bucket como público
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = NULL
WHERE id = 'message-media';

-- 3. Deletar TODAS as policies
DROP POLICY IF EXISTS "Public Access to message-media" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to message-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to message-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for message media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to message media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage message media" ON storage.objects;

-- 4. Reabilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Criar APENAS policy de leitura pública (super permissiva)
CREATE POLICY "Allow public read message-media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-media');

-- 6. Policy para service_role fazer tudo
CREATE POLICY "Allow service_role all message-media"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'message-media')
WITH CHECK (bucket_id = 'message-media');

-- 7. Verificar
SELECT
  id,
  name,
  public,
  'Bucket configurado como: ' || CASE WHEN public THEN '✅ PÚBLICO' ELSE '❌ PRIVADO' END as status
FROM storage.buckets
WHERE id = 'message-media';

-- 8. Verificar policies
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';
