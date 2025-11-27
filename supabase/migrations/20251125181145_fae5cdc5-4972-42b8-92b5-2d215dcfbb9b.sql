-- Recriar trigger para setup_company_creator (caso esteja mal configurado)
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION setup_company_creator();

-- Criar trigger para create_default_pipeline_for_company (cria pipeline padrão)
DROP TRIGGER IF EXISTS on_company_created_pipeline ON companies;
CREATE TRIGGER on_company_created_pipeline
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pipeline_for_company();

-- Corrigir RLS policy de SELECT para permitir acesso imediato do criador
DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;

CREATE POLICY "Users can view their companies"
ON companies FOR SELECT
USING (
  auth.uid() = created_by 
  OR EXISTS (
    SELECT 1 FROM company_users 
    WHERE user_id = auth.uid() AND company_id = companies.id
  )
);