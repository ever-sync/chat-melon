-- =====================================================
-- CORRIGIR CORS E TORNAR BUCKET PÚBLICO
-- =====================================================

-- 1. Verificar bucket atual
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'message-media';

-- 2. Garantir que bucket é público
UPDATE storage.buckets
SET public = true
WHERE id = 'message-media';

-- 3. Verificar policies de storage
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%message-media%';

-- 4. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Anyone can view message media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload message media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload message media" ON storage.objects;

-- 5. Criar policy de leitura pública
CREATE POLICY "Public read access for message media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-media');

-- 6. Criar policy de upload para autenticados
CREATE POLICY "Authenticated users can upload to message media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-media');

-- 7. Criar policy para service role (edge functions)
CREATE POLICY "Service role can manage message media"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'message-media')
WITH CHECK (bucket_id = 'message-media');

-- 8. Verificar que policies foram criadas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%message media%';

-- SUCESSO! ✅
-- Agora o bucket deve estar:
-- - Público para leitura
-- - Acessível para upload por usuários autenticados e service role
