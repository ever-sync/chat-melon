-- Corrigir políticas RLS da tabela evolution_settings
-- Problema: usuários não conseguem inserir/atualizar dados

-- 1. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their company evolution settings" ON evolution_settings;
DROP POLICY IF EXISTS "Users can insert their company evolution settings" ON evolution_settings;
DROP POLICY IF EXISTS "Users can update their company evolution settings" ON evolution_settings;
DROP POLICY IF EXISTS "Users can delete their company evolution settings" ON evolution_settings;

-- 2. Criar novas políticas mais permissivas

-- SELECT: Usuários podem ver configurações da sua empresa
CREATE POLICY "Users can view evolution_settings for their company"
  ON evolution_settings FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM company_users
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Usuários podem inserir configurações para sua empresa
CREATE POLICY "Users can insert evolution_settings for their company"
  ON evolution_settings FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM company_users
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- UPDATE: Usuários podem atualizar configurações da sua empresa
CREATE POLICY "Users can update evolution_settings for their company"
  ON evolution_settings FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id
      FROM company_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM company_users
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Usuários podem deletar configurações da sua empresa
CREATE POLICY "Users can delete evolution_settings for their company"
  ON evolution_settings FOR DELETE
  USING (
    company_id IN (
      SELECT company_id
      FROM company_users
      WHERE user_id = auth.uid()
    )
  );

-- Garantir que RLS está habilitado
ALTER TABLE evolution_settings ENABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE evolution_settings IS 'Configurações da Evolution API por empresa - com RLS corrigido';
