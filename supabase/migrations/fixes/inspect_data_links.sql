-- INSPECIONAR DADOS DETALHADOS
-- Vamos descobrir onde estão as imagens e por que não uniram

-- 1. Ver se existem contatos com foto
SELECT COUNT(*) as contatos_com_foto FROM contacts WHERE profile_pic_url IS NOT NULL;

-- 2. Ver exemplo de contato com foto (se houver)
SELECT id, name, phone, profile_pic_url FROM contacts WHERE profile_pic_url IS NOT NULL LIMIT 3;

-- 3. Ver se as conversas tem contact_id vinculados
SELECT id, contact_name, contact_id FROM conversations LIMIT 5;

-- 4. Tentar unir por NÚMERO DE TELEFONE (às vezes contact_id é null mas o número bate)
-- Assumindo que contact_number existe na conversations e phone existe em contacts
SELECT 
  c.id as conv_id, 
  c.contact_name, 
  c.contact_number,
  ct.name as contact_match,
  ct.profile_pic_url as foto_no_contato
FROM conversations c
LEFT JOIN contacts ct ON ct.phone = c.contact_number
LIMIT 5;
