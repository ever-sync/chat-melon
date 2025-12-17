-- =====================================================
-- CREATE STORAGE BUCKET FOR DEAL FILES
-- =====================================================

-- Criar bucket para arquivos de deals
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-files', 'deal-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies para o bucket deal-files

-- Permitir que membros da empresa vejam arquivos
CREATE POLICY "Company members can view deal files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'deal-files'
  AND auth.uid() IN (
    SELECT user_id FROM public.company_members
    WHERE is_active = true
  )
);

-- Permitir que membros da empresa façam upload
CREATE POLICY "Company members can upload deal files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deal-files'
  AND auth.uid() IN (
    SELECT user_id FROM public.company_members
    WHERE is_active = true
  )
);

-- Permitir que o uploader ou admin delete arquivos
CREATE POLICY "File uploader or admin can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'deal-files'
  AND (
    auth.uid() = owner
    OR auth.uid() IN (
      SELECT cm.user_id
      FROM public.company_members cm
      WHERE cm.role IN ('admin', 'manager')
      AND cm.is_active = true
    )
  )
);

-- Bucket criado com sucesso!
