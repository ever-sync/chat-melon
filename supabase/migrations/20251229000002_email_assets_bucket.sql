-- Create storage bucket for email assets (images, logos, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload email assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update email assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view email assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete email assets" ON storage.objects;

-- Policy: Allow authenticated users to upload email assets for their company
CREATE POLICY "Users can upload email assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');

-- Policy: Allow authenticated users to update their email assets
CREATE POLICY "Users can update email assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'email-assets');

-- Policy: Allow everyone to view email assets (public bucket for email rendering)
CREATE POLICY "Anyone can view email assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'email-assets');

-- Policy: Allow authenticated users to delete their email assets
CREATE POLICY "Users can delete email assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'email-assets');
