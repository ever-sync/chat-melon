-- Add missing indexes to improve RLS performance for company_members and company_users
-- These indexes are critical because almost every RLS policy performs a subquery on these tables using user_id.

-- 1. Index on company_members(user_id)
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);

-- 2. Index on company_members(company_id)
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);

-- 3. Composite index for membership check (common in RLS)
CREATE INDEX IF NOT EXISTS idx_company_members_user_company ON public.company_members(user_id, company_id) WHERE is_active = true;

-- 4. Index on company_users(user_id) for legacy compatibility
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);

-- 5. Index on company_users(company_id)
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);

-- 6. Index on companies(is_active) for the main query in CompanyContext
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);

-- 7. Index on evolution_settings(company_id) for the join in CompanyContext
CREATE INDEX IF NOT EXISTS idx_evolution_settings_company_id ON public.evolution_settings(company_id);

-- ============================================
-- STANDARDIZE RLS POLICIES TO USE COMPANY_MEMBERS
-- ============================================

-- A. COMPANIES TABLE
DROP POLICY IF EXISTS "Users can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Standardized view companies" ON public.companies;
CREATE POLICY "Standardized view companies" ON public.companies
FOR SELECT USING (
  id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- B. CHANNELS TABLE
DROP POLICY IF EXISTS "Users can view channels of their company" ON public.channels;
DROP POLICY IF EXISTS "Enable read access for company members" ON public.channels;
DROP POLICY IF EXISTS "Standardized view channels" ON public.channels;
CREATE POLICY "Standardized view channels" ON public.channels
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- C. EVOLUTION_SETTINGS TABLE
DROP POLICY IF EXISTS "Users can view evolution_settings for their company" ON public.evolution_settings;
DROP POLICY IF EXISTS "Standardized view evolution_settings" ON public.evolution_settings;
CREATE POLICY "Standardized view evolution_settings" ON public.evolution_settings
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- D. COMPANY_VARS TABLE (if exists)
DROP POLICY IF EXISTS "Users can view company_vars" ON public.company_variables;
DROP POLICY IF EXISTS "Standardized view company_variables" ON public.company_variables;
CREATE POLICY "Standardized view company_variables" ON public.company_variables
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- ============================================
-- DATA SYNCHRONIZATION (LEGACY TO NEW)
-- ============================================

-- Sync data from company_users to company_members for users that don't have it yet
INSERT INTO public.company_members (user_id, company_id, role, is_active, display_name, email)
SELECT 
    cu.user_id, 
    cu.company_id, 
    COALESCE(
        (
            SELECT 
                CASE 
                    WHEN ur.role::text = 'agent' THEN 'seller'
                    WHEN ur.role::text = 'viewer' THEN 'viewer'
                    WHEN ur.role::text = 'manager' THEN 'manager'
                    WHEN ur.role::text = 'admin' THEN 'admin'
                    ELSE 'seller'
                END
            FROM public.user_roles ur 
            WHERE ur.user_id = cu.user_id AND ur.company_id = cu.company_id 
            LIMIT 1
        ),
        'seller'
    )::public.user_role,
    true,
    COALESCE(p.full_name, p.phone),
    p.phone -- Fallback for email if not available in profile
FROM public.company_users cu
JOIN public.profiles p ON p.id = cu.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.company_members cm 
    WHERE cm.user_id = cu.user_id AND cm.company_id = cu.company_id
)
ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATE VIEWS
-- ============================================

-- Ensure last_seen_at exists in profiles before creating the view
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
  END IF;
END $$;

-- Redefine online_users safely (Security Fix consistent with 20260117210000)
DROP VIEW IF EXISTS online_users;
CREATE OR REPLACE VIEW online_users 
WITH (security_invoker = true)
AS
SELECT DISTINCT
  p.id,
  p.full_name,
  p.avatar_url,
  cm.company_id,
  COALESCE(p.full_name, 'Usuário') as display_name,
  CASE
    WHEN p.last_seen_at > NOW() - INTERVAL '15 minutes' THEN true
    ELSE false
  END as is_online,
  p.last_seen_at as last_sign_in_at
FROM public.profiles p
JOIN public.company_members cm ON cm.user_id = p.id
WHERE cm.is_active = true;

GRANT SELECT ON online_users TO authenticated;
