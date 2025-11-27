-- Migrar dados de company_users para company_members
-- Isso garante que usuários existentes sejam reconhecidos pelo sistema RBAC

INSERT INTO company_members (user_id, company_id, role, is_active, created_at)
SELECT 
  cu.user_id,
  cu.company_id,
  'owner'::user_role,
  true,
  cu.created_at
FROM company_users cu
WHERE NOT EXISTS (
  SELECT 1 FROM company_members cm 
  WHERE cm.user_id = cu.user_id 
  AND cm.company_id = cu.company_id
);

-- Criar trigger para manter sincronização automática
CREATE OR REPLACE FUNCTION sync_company_user_to_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um novo registro é inserido em company_users, também insere em company_members
  INSERT INTO company_members (user_id, company_id, role, is_active, created_at)
  VALUES (NEW.user_id, NEW.company_id, 'owner'::user_role, true, NEW.created_at)
  ON CONFLICT (user_id, company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger que dispara após INSERT em company_users
DROP TRIGGER IF EXISTS trigger_sync_company_user_to_member ON company_users;
CREATE TRIGGER trigger_sync_company_user_to_member
  AFTER INSERT ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_user_to_member();