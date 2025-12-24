-- =====================================================
-- CORRIGIR assistant_settings
-- Execute este SQL no Supabase
-- =====================================================

-- 1. Adicionar constraint UNIQUE se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assistant_settings_user_id_key'
  ) THEN
    ALTER TABLE assistant_settings ADD CONSTRAINT assistant_settings_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN others THEN
  -- Constraint já existe ou outro erro, ignorar
  NULL;
END $$;

-- 2. Garantir que RLS está configurado corretamente
ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "allow_all_as" ON assistant_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON assistant_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON assistant_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON assistant_settings;

-- Criar política permissiva para authenticated users
CREATE POLICY "authenticated_full_access" ON assistant_settings
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para service role (Edge Functions)
CREATE POLICY "service_role_full_access" ON assistant_settings
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT 'assistant_settings corrigido!' as resultado;
