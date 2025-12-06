-- Adicionar campos extras ao perfil do usuário
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Comentários explicativos
COMMENT ON COLUMN profiles.first_name IS 'Primeiro nome do usuário';
COMMENT ON COLUMN profiles.last_name IS 'Sobrenome do usuário';
COMMENT ON COLUMN profiles.nickname IS 'Apelido que aparece nos locais de login';
COMMENT ON COLUMN profiles.email IS 'Email de contato do usuário';

-- Atualizar função de criação de usuário para incluir email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;
