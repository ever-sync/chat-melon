DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
-- ============================================
-- AUTO-CREATE COMPANY ON USER SIGNUP
-- ============================================
-- Quando um usuário confirma o email, cria automaticamente uma empresa em trial

-- 1. Função que cria empresa e perfil após confirmação
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_company_id UUID;
  free_plan_id UUID;
BEGIN
  -- Pega o ID do plano Free
  SELECT id INTO free_plan_id
  FROM subscription_plans
  WHERE slug = 'free'
  LIMIT 1;

  -- Se não encontrou o plano free, usa o primeiro plano disponível
  IF free_plan_id IS NULL THEN
    SELECT id INTO free_plan_id
    FROM subscription_plans
    WHERE is_active = true
    ORDER BY order_index
    LIMIT 1;
  END IF;

  -- Cria a empresa
  INSERT INTO companies (
    name,
    plan_id,
    subscription_status,
    trial_ends_at,
    is_primary_company,
    is_active
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    free_plan_id,
    'trial',
    NOW() + INTERVAL '3 days', -- 3 dias de trial
    true,
    true
  )
  RETURNING id INTO new_company_id;

  -- Cria o perfil do usuário
  INSERT INTO profiles (
    id,
    full_name,
    avatar_url
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;

  -- Cria a role de owner para o usuário
  INSERT INTO user_roles (
    user_id,
    company_id,
    role
  ) VALUES (
    NEW.id,
    new_company_id,
    'owner'
  );

  RETURN NEW;
END;
$$;

-- 2. Remove trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Cria trigger que dispara quando usuário é criado E confirmado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user_signup();

-- 4. Também dispara quando email é confirmado posteriormente
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_company_id UUID;
BEGIN
  -- Verifica se já tem empresa (evita duplicação)
  SELECT company_id INTO existing_company_id
  FROM user_roles
  WHERE user_id = NEW.id
  LIMIT 1;

  -- Se já tem empresa, não faz nada
  IF existing_company_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se não tem empresa, chama a função de signup
  PERFORM handle_new_user_signup();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;

CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS NULL AND
    NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION handle_user_email_confirmed();

-- 5. Comentários
COMMENT ON FUNCTION handle_new_user_signup() IS 'Cria empresa, perfil e role automaticamente quando usuário confirma email';
COMMENT ON FUNCTION handle_user_email_confirmed() IS 'Garante que empresa é criada mesmo se confirmação de email acontecer depois';
