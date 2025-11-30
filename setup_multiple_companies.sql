-- PLANO: CRIAR EMPRESAS PARA CADA INSTÂNCIA
-- Execute esses comandos UM POR VEZ, criando as empresas via interface primeiro

-- 1. Criar empresa "Unifatec" via interface do sistema
-- 2. Depois de criar, anotar o company_id e rodar:
-- INSERT INTO evolution_settings (company_id, user_id, instance_name, instance_status, is_connected)
-- VALUES ('COMPANY_ID_DA_UNIFATEC', 'SEU_USER_ID', 'ElisangelaUnifatec', 'connected', true);

-- 3. Criar empresa "Raphael" via interface
-- 4. Depois de criar, rodar:
-- INSERT INTO evolution_settings (company_id, user_id, instance_name, instance_status, is_connected)
-- VALUES ('COMPANY_ID_DO_RAPHAEL', 'SEU_USER_ID', 'RaphaelSantos', 'connected', true);

-- 5. Criar empresa "EDHA" via interface
-- 6. Depois de criar, rodar:
-- INSERT INTO evolution_settings (company_id, user_id, instance_name, instance_status, is_connected)
-- VALUES ('COMPANY_ID_DA_EDHA', 'SEU_USER_ID', 'EDHA', 'connected', true);

-- Para pegar seu user_id:
SELECT auth.uid();
