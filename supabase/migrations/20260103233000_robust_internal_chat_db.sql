-- Atualizar View de Usuários Online para ser mais robusta e usar perfis sincronizados
DROP VIEW IF EXISTS online_users;
CREATE VIEW online_users AS
SELECT DISTINCT
  p.id,
  u.email,
  p.full_name,
  p.avatar_url,
  cu.company_id,
  COALESCE(p.full_name, u.email) as display_name,
  CASE
    WHEN u.last_sign_in_at > NOW() - INTERVAL '15 minutes' THEN true
    ELSE false
  END as is_online,
  u.last_sign_in_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
JOIN public.company_users cu ON cu.user_id = u.id;

-- Grant permissions again for the updated view
GRANT SELECT ON online_users TO authenticated;

-- Criar Bucket para Mídia do Chat Interno se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('internal-chat-media', 'internal-chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para o Chat Interno
DROP POLICY IF EXISTS "Authenticated users can upload internal chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload internal chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'internal-chat-media');

DROP POLICY IF EXISTS "Anyone can view internal chat media" ON storage.objects;
CREATE POLICY "Anyone can view internal chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'internal-chat-media');

-- Adicionar política de DELETE para mensagens internas
DROP POLICY IF EXISTS "Users can delete messages they sent" ON internal_messages;
CREATE POLICY "Users can delete messages they sent"
ON internal_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);
