-- ===============================================
-- FIX FINAL: SINCRONIZAR IMAGENS CORRETAMENTE
-- ===============================================

-- Coluna correta é 'phone_number' (não 'phone')
-- Também notei que existe 'profile_picture_url' E 'profile_pic_url'
-- Vamos usar COALESCE para pegar a que estiver preenchida

-- 1. Sincronizar imagens de 'contacts' para 'conversations'
UPDATE conversations c
SET profile_pic_url = COALESCE(ct.profile_pic_url, ct.profile_picture_url)
FROM contacts ct
WHERE 
  -- Tenta unir por ID ou Telefone
  (c.contact_id = ct.id OR c.contact_number = ct.phone_number)
  AND c.profile_pic_url IS NULL
  AND (ct.profile_pic_url IS NOT NULL OR ct.profile_picture_url IS NOT NULL);

-- 2. Verificar quantos foram atualizados
SELECT 
    COUNT(*) as total_conversas,
    COUNT(profile_pic_url) as conversas_com_foto_agora
FROM conversations;

-- 3. Ver amostra das imagens atualizadas
SELECT id, contact_name, profile_pic_url 
FROM conversations 
WHERE profile_pic_url IS NOT NULL 
LIMIT 5;
