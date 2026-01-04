-- Verificar contatos do Instagram e seus nomes

-- 1. Ver todos os contatos Instagram
SELECT
    id,
    name,
    phone_number,
    external_id,
    profile_picture_url,
    created_at,
    updated_at
FROM contacts
WHERE channel_type = 'instagram'
ORDER BY created_at DESC;

-- 2. Ver quantos têm nome genérico vs nome real
SELECT
    CASE
        WHEN name LIKE 'Instagram User %' THEN 'Nome Genérico'
        ELSE 'Nome Real'
    END as tipo_nome,
    COUNT(*) as total
FROM contacts
WHERE channel_type = 'instagram'
GROUP BY tipo_nome;

-- 3. Ver se algum tem foto de perfil
SELECT
    COUNT(*) as total_contatos,
    COUNT(profile_picture_url) as com_foto,
    COUNT(*) - COUNT(profile_picture_url) as sem_foto
FROM contacts
WHERE channel_type = 'instagram';
