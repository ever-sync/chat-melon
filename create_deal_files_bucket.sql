-- ================================================================
-- CRIAR BUCKET PARA ARQUIVOS DE DEALS
-- Execute no Supabase Dashboard -> SQL Editor
-- ================================================================

-- Inserir bucket (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'deal-files',
    'deal-files',
    false,  -- Bucket privado
    10485760,  -- 10MB limite
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- POLÍTICAS DE STORAGE
-- ============================================

-- Política de SELECT - Usuários autenticados podem ver arquivos de suas empresas
DROP POLICY IF EXISTS "deal_files_select" ON storage.objects;
CREATE POLICY "deal_files_select" ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- Política de INSERT - Usuários autenticados podem fazer upload para suas empresas
DROP POLICY IF EXISTS "deal_files_insert" ON storage.objects;
CREATE POLICY "deal_files_insert" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- Política de DELETE - Usuários autenticados podem deletar arquivos de suas empresas
DROP POLICY IF EXISTS "deal_files_delete" ON storage.objects;
CREATE POLICY "deal_files_delete" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- Política de UPDATE - Usuários autenticados podem atualizar arquivos de suas empresas
DROP POLICY IF EXISTS "deal_files_update" ON storage.objects;
CREATE POLICY "deal_files_update" ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'deal-files'
    AND (storage.foldername(name))[1] IN (
        SELECT company_id::text FROM profiles WHERE id = auth.uid()
    )
);

-- ============================================
-- VERIFICAR BUCKET CRIADO
-- ============================================

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'deal-files';
