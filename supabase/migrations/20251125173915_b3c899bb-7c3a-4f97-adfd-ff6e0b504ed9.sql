-- Fix RLS policies and add automatic company setup triggers

-- 1. Allow authenticated users to create companies
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
CREATE POLICY "Authenticated users can create companies"
ON companies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Function to automatically setup company creator
CREATE OR REPLACE FUNCTION setup_company_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Add user as company member with default flag
  INSERT INTO company_users (company_id, user_id, is_default)
  VALUES (NEW.id, NEW.created_by, true)
  ON CONFLICT (user_id, company_id) DO NOTHING;
  
  -- Give admin role to creator
  INSERT INTO user_roles (company_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create trigger on companies table
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION setup_company_creator();

-- 4. Allow company_users inserts via trigger (system can insert)
DROP POLICY IF EXISTS "Users can view their company memberships" ON company_users;
CREATE POLICY "Users can view their company memberships"
ON company_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert company_users"
ON company_users FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);