-- =====================================================
-- EXECUTAR ESTE SQL NO SUPABASE SQL EDITOR
-- =====================================================
-- Este script cria o bucket de storage para fotos de perfil
-- dos usuários e configura as políticas de acesso
-- =====================================================

-- 1. Criar bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 3. Policy: Permitir que usuários façam upload do próprio avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Permitir que usuários atualizem o próprio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Permitir que todos vejam os avatares (público)
CREATE POLICY "Anyone can view user avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- 6. Policy: Permitir que usuários excluam o próprio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Adicionar coluna avatar_url à tabela profiles se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 8. Comentário explicativo
COMMENT ON COLUMN profiles.avatar_url IS 'URL da foto de perfil do usuário armazenada no bucket user-avatars';

-- 9. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Após executar este script:
-- 1. Vá em Configurações > Meu Perfil
-- 2. Clique no ícone de câmera ou no botão "Alterar Foto"
-- 3. Selecione uma imagem (PNG, JPG, JPEG ou WebP)
-- 4. A foto será enviada e aparecerá no chat automaticamente
-- =====================================================
