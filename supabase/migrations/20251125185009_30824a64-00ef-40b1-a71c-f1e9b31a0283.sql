-- Add unique constraints to support ON CONFLICT clauses in setup_company_creator
ALTER TABLE public.company_users
  ADD CONSTRAINT company_users_user_company_unique UNIQUE (user_id, company_id);

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_company_unique UNIQUE (user_id, company_id);
