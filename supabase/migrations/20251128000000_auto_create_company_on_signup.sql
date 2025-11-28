-- Criar empresa e permissões automaticamente ao criar novo usuário

-- Função que será executada quando um novo usuário se cadastrar
-- Agora apenas garante que o perfil existe - empresa será criada no onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas garantir que o perfil básico existe
  -- A empresa será criada quando o usuário completar o onboarding
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger que executa após inserir novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Comentário
COMMENT ON FUNCTION public.handle_new_user_signup() IS 
'Cria automaticamente empresa, vincula o usuário e define como admin quando um novo usuário se cadastra';
