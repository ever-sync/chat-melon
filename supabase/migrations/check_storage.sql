-- VERIFICAR ARQUIVOS NO STORAGE
-- Você disse que as imagens estão no banco. Se não estão nas tabelas, devem estar no Storage.
-- Vamos verificar se existem arquivos físicos salvos.

SELECT 
  id, 
  bucket_id, 
  name, 
  created_at,
  metadata 
FROM storage.objects 
WHERE bucket_id = 'contact-photos' 
LIMIT 10;
