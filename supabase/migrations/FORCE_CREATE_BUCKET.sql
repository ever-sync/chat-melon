-- =====================================================
-- FORÇAR CRIAÇÃO DO BUCKET (se não existir)
-- =====================================================

-- Criar bucket (ignora se já existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('message-media', 'message-media', true, 52428800)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Garantir que bucket é público
UPDATE storage.buckets
SET public = true
WHERE id = 'message-media';

-- Verificar
SELECT * FROM storage.buckets WHERE id = 'message-media';
