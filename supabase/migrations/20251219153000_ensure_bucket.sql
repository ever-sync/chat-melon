-- Force creation of message-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-media',
  'message-media',
  true,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Ensure RLS policies exist (re-run to be safe)
DROP POLICY IF EXISTS "Anyone can view message media" ON storage.objects;
CREATE POLICY "Anyone can view message media"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-media');

DROP POLICY IF EXISTS "Company members can upload message media" ON storage.objects;
CREATE POLICY "Company members can upload message media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media'
  AND auth.uid() IN (
    SELECT user_id FROM public.company_members WHERE is_active = true
  )
);

DROP POLICY IF EXISTS "Service role can upload message media" ON storage.objects;
CREATE POLICY "Service role can upload message media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media'
  AND auth.role() = 'service_role'
);
