-- =====================================================
-- SISTEMA DE ROLES E PERMISSÕES
-- =====================================================

-- Enum para roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'supervisor', 'seller', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de membros da empresa (relaciona usuário com empresa e role)
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  
  -- Informações do vendedor
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  can_receive_chats BOOLEAN DEFAULT true,
  max_concurrent_chats INTEGER DEFAULT 10,
  
  -- Equipe (para supervisores/gerentes)
  team_id UUID,
  reports_to UUID,
  
  -- Horário de trabalho
  working_hours JSONB DEFAULT '{
    "monday": {"start": "09:00", "end": "18:00", "enabled": true},
    "tuesday": {"start": "09:00", "end": "18:00", "enabled": true},
    "wednesday": {"start": "09:00", "end": "18:00", "enabled": true},
    "thursday": {"start": "09:00", "end": "18:00", "enabled": true},
    "friday": {"start": "09:00", "end": "18:00", "enabled": true},
    "saturday": {"start": "09:00", "end": "13:00", "enabled": false},
    "sunday": {"start": null, "end": null, "enabled": false}
  }'::jsonb,
  
  -- Status online
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  current_status TEXT DEFAULT 'offline',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, user_id)
);

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  leader_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar FKs após criar ambas as tabelas
ALTER TABLE company_members 
  ADD CONSTRAINT company_members_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE company_members 
  ADD CONSTRAINT company_members_reports_to_fkey 
  FOREIGN KEY (reports_to) REFERENCES company_members(id) ON DELETE SET NULL;

ALTER TABLE teams 
  ADD CONSTRAINT teams_leader_id_fkey 
  FOREIGN KEY (leader_id) REFERENCES company_members(id) ON DELETE SET NULL;

-- Tabela de convites
CREATE TABLE IF NOT EXISTS company_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de permissões customizadas
CREATE TABLE IF NOT EXISTS member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES company_members(id) ON DELETE CASCADE NOT NULL,
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, permission_key)
);

-- Tabela de permissões padrão por role
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(role, permission_key)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON company_members(role);
CREATE INDEX IF NOT EXISTS idx_company_members_team ON company_members(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_company ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invites_email ON company_invites(email);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies para company_members
DROP POLICY IF EXISTS "Users can view members in their company" ON company_members;
CREATE POLICY "Users can view members in their company"
  ON company_members FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can manage members" ON company_members;
CREATE POLICY "Admins can manage members"
  ON company_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE user_id = auth.uid() 
      AND company_id = company_members.company_id 
      AND role IN ('owner', 'admin')
    )
  );

-- Policies para teams
DROP POLICY IF EXISTS "Users can view teams in their company" ON teams;
CREATE POLICY "Users can view teams in their company"
  ON teams FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE user_id = auth.uid() 
      AND company_id = teams.company_id 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Policies para invites
DROP POLICY IF EXISTS "Users can view invites in their company" ON company_invites;
CREATE POLICY "Users can view invites in their company"
  ON company_invites FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can manage invites" ON company_invites;
CREATE POLICY "Admins can manage invites"
  ON company_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE user_id = auth.uid() 
      AND company_id = company_invites.company_id 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_company_members_updated_at ON company_members;
CREATE TRIGGER update_company_members_updated_at
  BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÕES DE PERMISSÃO
-- =====================================================

CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_company_id UUID,
  p_permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
  v_role user_role;
  v_custom_permission BOOLEAN;
  v_role_permission BOOLEAN;
BEGIN
  SELECT id, role INTO v_member_id, v_role
  FROM company_members
  WHERE user_id = p_user_id AND company_id = p_company_id AND is_active = true;
  
  IF v_member_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT is_granted INTO v_custom_permission
  FROM member_permissions
  WHERE member_id = v_member_id AND permission_key = p_permission_key;
  
  IF v_custom_permission IS NOT NULL THEN
    RETURN v_custom_permission;
  END IF;
  
  SELECT is_granted INTO v_role_permission
  FROM role_permissions
  WHERE role = v_role AND permission_key = p_permission_key;
  
  RETURN COALESCE(v_role_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_company_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_role user_role;
  v_permissions JSONB;
BEGIN
  SELECT id, role INTO v_member_id, v_role
  FROM company_members
  WHERE user_id = p_user_id AND company_id = p_company_id AND is_active = true;
  
  IF v_member_id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  SELECT jsonb_object_agg(
    permission_key,
    COALESCE(
      (SELECT is_granted FROM member_permissions WHERE member_id = v_member_id AND permission_key = rp.permission_key),
      rp.is_granted
    )
  ) INTO v_permissions
  FROM role_permissions rp
  WHERE rp.role = v_role;
  
  RETURN COALESCE(v_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POPULAR PERMISSÕES PADRÃO (apenas essenciais)
-- =====================================================

INSERT INTO role_permissions (role, permission_key, is_granted) VALUES
('owner', 'settings.users', true),
('admin', 'settings.users', true),
('manager', 'settings.users', false),
('supervisor', 'settings.users', false),
('seller', 'settings.users', false),
('viewer', 'settings.users', false)
ON CONFLICT (role, permission_key) DO NOTHING;