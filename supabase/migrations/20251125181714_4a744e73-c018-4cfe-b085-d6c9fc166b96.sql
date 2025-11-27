-- Adicionar constraint UNIQUE na tabela company_users para suportar ON CONFLICT
ALTER TABLE company_users 
ADD CONSTRAINT company_users_user_id_company_id_unique 
UNIQUE (user_id, company_id);

-- Adicionar constraint UNIQUE na tabela user_roles para suportar ON CONFLICT
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_user_id_company_id_unique 
UNIQUE (user_id, company_id);