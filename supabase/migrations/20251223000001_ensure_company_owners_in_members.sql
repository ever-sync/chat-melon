-- Garantir que todos os owners de empresas tenham um registro em company_members

-- Inserir owners que não estão em company_members
INSERT INTO public.company_members (
  company_id,
  user_id,
  role,
  display_name,
  email,
  is_active,
  created_at,
  updated_at
)
SELECT 
  c.id as company_id,
  c.created_by as user_id,
  'owner'::user_role as role,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as display_name,
  u.email,
  true as is_active,
  c.created_at,
  now() as updated_at
FROM public.companies c
JOIN auth.users u ON u.id = c.created_by
WHERE c.created_by IS NOT NULL
  AND NOT EXISTS (
  SELECT 1 
  FROM public.company_members cm 
  WHERE cm.company_id = c.id 
    AND cm.user_id = c.created_by
)
ON CONFLICT (company_id, user_id) DO NOTHING;

-- Criar uma função trigger para garantir que novos owners sejam adicionados automaticamente
CREATE OR REPLACE FUNCTION public.ensure_company_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma nova empresa é criada, adicionar o owner como membro
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.company_members (
      company_id,
      user_id,
      role,
      display_name,
      email,
      is_active
    )
    SELECT 
      NEW.id,
      NEW.created_by,
      'owner'::user_role,
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      ),
      u.email,
      true
    FROM auth.users u
    WHERE u.id = NEW.created_by
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS ensure_company_owner_member_trigger ON public.companies;
CREATE TRIGGER ensure_company_owner_member_trigger
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_company_owner_member();

-- Atualizar membros existentes que não têm display_name ou email
UPDATE public.company_members cm
SET 
  display_name = COALESCE(
    cm.display_name,
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  email = COALESCE(cm.email, u.email)
FROM auth.users u
WHERE cm.user_id = u.id
  AND (cm.display_name IS NULL OR cm.email IS NULL);
