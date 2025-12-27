-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload logos for their company
CREATE POLICY "Users can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies
    WHERE id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Allow authenticated users to update logos for their company
CREATE POLICY "Users can update company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies
    WHERE id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Allow everyone to view company logos (public bucket)
CREATE POLICY "Anyone can view company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Policy: Allow authenticated users to delete logos for their company
CREATE POLICY "Users can delete company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies
    WHERE id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  )
);
