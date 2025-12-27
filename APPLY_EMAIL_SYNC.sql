-- =====================================================
-- EXECUTAR ESTE SQL NO SUPABASE SQL EDITOR
-- =====================================================
-- Este script cria um trigger para sincronizar alterações
-- de email do auth.users para a tabela profiles automaticamente
--
-- IMPORTANTE: Após alterar o email via Supabase Auth,
-- o email será automaticamente atualizado em profiles
-- e estará disponível em todas as empresas vinculadas
-- =====================================================

-- Função para sincronizar email quando alterado
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o email foi alterado
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    -- Atualizar email na tabela profiles
    UPDATE profiles
    SET
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;

    -- Log da alteração
    RAISE NOTICE 'Email sincronizado para user_id %: % -> %', NEW.id, OLD.email, NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para sincronizar email automaticamente
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Comentário explicativo
COMMENT ON FUNCTION sync_user_email() IS 'Sincroniza alterações de email do auth.users para profiles automaticamente';

-- Garantir que a coluna email existe em profiles (já deve existir, mas vamos garantir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Criar índice para melhorar performance de buscas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Após executar este script:
-- 1. Vá em Configurações > Meu Perfil
-- 2. Clique em "Alterar Email"
-- 3. Digite o novo email duas vezes
-- 4. Clique em "Confirmar Alteração"
-- 5. Verifique o email de confirmação
-- 6. Clique no link para confirmar
-- 7. O email será atualizado automaticamente em todas as tabelas
-- =====================================================
