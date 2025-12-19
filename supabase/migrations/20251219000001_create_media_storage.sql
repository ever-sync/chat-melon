-- =====================================================
-- CREATE STORAGE BUCKET FOR MESSAGE MEDIA
-- =====================================================
-- Bucket para armazenar mídias de mensagens (áudio, vídeo, imagem, documentos)

-- Criar bucket público para mídias de mensagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-media',
  'message-media',
  true, -- Público para que seja acessível via URL direta
  52428800, -- 50MB máximo por arquivo
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view message media" ON storage.objects;
DROP POLICY IF EXISTS "Company members can upload message media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload message media" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin can delete message media" ON storage.objects;

-- Política: Qualquer um pode VER arquivos (bucket público)
CREATE POLICY "Anyone can view message media"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-media');

-- Política: Membros da empresa podem FAZER UPLOAD
CREATE POLICY "Company members can upload message media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media'
  AND auth.uid() IN (
    SELECT user_id FROM public.company_members
    WHERE is_active = true
  )
);

-- Política: System (edge functions) pode FAZER UPLOAD (para webhook)
CREATE POLICY "Service role can upload message media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media'
  AND auth.role() = 'service_role'
);

-- Política: Owner ou admin pode DELETAR
CREATE POLICY "Owner or admin can delete message media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-media'
  AND (
    auth.uid() = owner
    OR auth.uid() IN (
      SELECT cm.user_id
      FROM public.company_members cm
      WHERE cm.role IN ('admin', 'owner')
      AND cm.is_active = true
    )
  )
);

-- =====================================================
-- HELPER FUNCTION: Get public URL for media
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_media_public_url(storage_path text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  supabase_url text;
BEGIN
  -- Pega a URL base do Supabase (ajuste conforme necessário)
  supabase_url := current_setting('app.settings.supabase_url', true);

  IF supabase_url IS NULL THEN
    -- Fallback: usar a URL do projeto atual
    RETURN format(
      '%s/storage/v1/object/public/message-media/%s',
      current_setting('request.headers', true)::json->>'origin',
      storage_path
    );
  END IF;

  RETURN format('%s/storage/v1/object/public/message-media/%s', supabase_url, storage_path);
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION public.get_media_public_url IS 'Retorna URL pública para um arquivo no bucket message-media';
