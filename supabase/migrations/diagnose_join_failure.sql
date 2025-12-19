-- DIAGNOSTICO EXTREMO - POR QUE NAO ESTA UNINDO?
-- Vamos pegar uma conversa especifica e ver se encontramos o contato dela

-- 1. Pegar um numero de uma conversa existente
SELECT id, contact_name, contact_number FROM conversations LIMIT 1;

-- 2. Tentar achar esse numero exato na tabela contatos
WITH sample_conv AS (SELECT contact_number FROM conversations LIMIT 1)
SELECT 
  c.id, 
  c.name, 
  c.phone_number,
  c.profile_pic_url,
  c.profile_picture_url
FROM contacts c, sample_conv s
WHERE c.phone_number LIKE '%' || s.contact_number || '%';

-- 3. Ver se contatos tem ALGUMA imagem (geral)
SELECT COUNT(*) as contatos_com_imagem_url FROM contacts WHERE profile_pic_url IS NOT NULL OR profile_picture_url IS NOT NULL;
