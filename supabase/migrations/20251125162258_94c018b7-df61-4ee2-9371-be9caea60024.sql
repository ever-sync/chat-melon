-- Função para criar pipeline padrão para uma empresa
CREATE OR REPLACE FUNCTION create_default_pipeline_for_company()
RETURNS TRIGGER AS $$
DECLARE
  _pipeline_id uuid;
  _stage_novo_lead uuid;
  _stage_qualificacao uuid;
  _stage_apresentacao uuid;
  _stage_proposta uuid;
  _stage_negociacao uuid;
  _stage_ganho uuid;
  _stage_perdido uuid;
BEGIN
  -- Criar o pipeline padrão
  INSERT INTO pipelines (company_id, name, description, is_default, order_index)
  VALUES (NEW.id, 'Pipeline de Vendas', 'Pipeline padrão de vendas', true, 0)
  RETURNING id INTO _pipeline_id;
  
  -- Criar os stages do pipeline
  INSERT INTO pipeline_stages (pipeline_id, name, color, order_index, probability_default, is_closed_won, is_closed_lost)
  VALUES 
    (_pipeline_id, 'Novo Lead', '#6B7280', 0, 10, false, false),
    (_pipeline_id, 'Qualificação', '#3B82F6', 1, 25, false, false),
    (_pipeline_id, 'Apresentação', '#8B5CF6', 2, 50, false, false),
    (_pipeline_id, 'Proposta', '#F59E0B', 3, 75, false, false),
    (_pipeline_id, 'Negociação', '#EF4444', 4, 90, false, false),
    (_pipeline_id, 'Fechado Ganho', '#10B981', 5, 100, true, false),
    (_pipeline_id, 'Fechado Perdido', '#EF4444', 6, 0, false, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar pipeline automaticamente
DROP TRIGGER IF EXISTS trigger_create_default_pipeline ON companies;
CREATE TRIGGER trigger_create_default_pipeline
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pipeline_for_company();

-- Inserir empresa de teste (somente se não existir)
DO $$
DECLARE
  _company_id uuid;
  _user_id uuid;
BEGIN
  -- Buscar um usuário existente ou usar um ID fixo para teste
  SELECT id INTO _user_id FROM auth.users LIMIT 1;
  
  -- Se não houver usuário, usar um ID de exemplo (será necessário ter um usuário real)
  IF _user_id IS NULL THEN
    _user_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;
  
  -- Inserir empresa de teste se não existir
  IF NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Empresa Teste CRM') THEN
    INSERT INTO companies (name, email, phone, cnpj, is_active, created_by)
    VALUES (
      'Empresa Teste CRM',
      'contato@empresateste.com',
      '(11) 99999-9999',
      '00.000.000/0001-00',
      true,
      _user_id
    )
    RETURNING id INTO _company_id;
    
    -- O trigger criará automaticamente o pipeline e stages
    RAISE NOTICE 'Empresa de teste criada com ID: %', _company_id;
  ELSE
    RAISE NOTICE 'Empresa de teste já existe';
  END IF;
END $$;