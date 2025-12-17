-- ============================================
-- FIX: Adicionar política de DELETE para contacts
-- ============================================

-- 1. Adicionar coluna company_id em profiles se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- 2. Adicionar política de DELETE para contacts
DROP POLICY IF EXISTS "Users can delete contacts in their company" ON contacts;

DROP POLICY IF EXISTS "Users can delete contacts in their company" ON contacts;
CREATE POLICY "Users can delete contacts in their company"
  ON contacts FOR DELETE
  USING (company_id = get_user_company(auth.uid()));

-- 3. Garantir que profiles tem company_id populado via company_members
-- Criar função para buscar company_id do usuário atual via company_members
CREATE OR REPLACE FUNCTION sync_profile_company_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza profiles.company_id quando um usuário é adicionado como membro de empresa
  UPDATE profiles 
  SET company_id = NEW.company_id
  WHERE id = NEW.user_id 
    AND (company_id IS NULL OR company_id != NEW.company_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS sync_profile_company_id_trigger ON company_members;
CREATE TRIGGER sync_profile_company_id_trigger
  AFTER INSERT ON company_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_company_id();

-- 4. Sincronizar company_id existentes de profiles baseado em company_members
UPDATE profiles p
SET company_id = (
  SELECT cm.company_id 
  FROM company_members cm 
  WHERE cm.user_id = p.id 
  ORDER BY cm.created_at DESC 
  LIMIT 1
)
WHERE p.company_id IS NULL
  AND EXISTS (
    SELECT 1 FROM company_members cm WHERE cm.user_id = p.id
  );

-- 5. Também sincronizar baseado em company_users (tabela alternativa usada em algumas partes do sistema)
UPDATE profiles p
SET company_id = (
  SELECT cu.company_id 
  FROM company_users cu 
  WHERE cu.user_id = p.id 
  ORDER BY cu.created_at DESC 
  LIMIT 1
)
WHERE p.company_id IS NULL
  AND EXISTS (
    SELECT 1 FROM company_users cu WHERE cu.user_id = p.id
  );

-- 6. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Coluna company_id adicionada em profiles!';
  RAISE NOTICE '✅ Política de DELETE para contacts criada com sucesso!';
  RAISE NOTICE '✅ Trigger de sincronização de company_id criado!';
  RAISE NOTICE '✅ Profiles existentes sincronizados com company_id!';
END $$;
