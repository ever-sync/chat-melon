-- ==========================================
-- FIX COMPLETÃO: IMAGENS E VISIBILIDADE DO CHAT
-- ==========================================

-- 1. Sincronizar imagens de 'contacts' para 'conversations'
-- Isso garante que mesmo se o JOIN falhar, a conversa tenha a foto
UPDATE conversations c
SET profile_pic_url = ct.profile_pic_url
FROM contacts ct
WHERE c.contact_id = ct.id
AND c.profile_pic_url IS NULL
AND ct.profile_pic_url IS NOT NULL;

-- 2. Garantir que Policy de Conversas permite visualização
DROP POLICY IF EXISTS "Enable read access for company members" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations of their company" ON conversations;

CREATE POLICY "Users can view conversations of their company"
ON conversations FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM company_members 
    WHERE user_id = auth.uid()
  )
);

-- 3. Correção de segurança para Storage (Imagens)
-- Garante que imagens do bucket 'contact-photos' sejam públicas/legíveis
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-photos', 'contact-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'contact-photos' );

-- 4. Verificação Final (Retorno para você ver)
SELECT 
    COUNT(*) as total_conversas,
    COUNT(profile_pic_url) as conversas_com_foto
FROM conversations;
