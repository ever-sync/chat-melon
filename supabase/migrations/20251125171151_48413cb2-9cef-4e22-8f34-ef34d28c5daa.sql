-- Adicionar campos para assinatura digital e achievements

-- Atualizar tabela proposals para assinatura
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_document TEXT;

-- Criar tabela de visualizações de propostas
CREATE TABLE IF NOT EXISTS proposal_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal ON proposal_views(proposal_id);

-- Criar tabela de goals (metas)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('revenue', 'deals', 'calls', 'meetings', 'response_time')),
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB NOT NULL,
  points INTEGER DEFAULT 0,
  badge_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de achievements dos usuários
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Criar tabela de snapshots do leaderboard
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  rankings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_company ON goals(company_id);
CREATE INDEX IF NOT EXISTS idx_achievements_company ON achievements(company_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_company ON leaderboard_snapshots(company_id);

-- RLS para proposal_views (público pode inserir)
ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track proposal views" ON proposal_views;
CREATE POLICY "Anyone can track proposal views"
  ON proposal_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view proposal views" ON proposal_views;
CREATE POLICY "Users can view proposal views"
  ON proposal_views FOR SELECT
  USING (proposal_id IN (
    SELECT id FROM proposals WHERE deal_id IN (
      SELECT id FROM deals WHERE company_id = get_user_company(auth.uid())
    )
  ));

-- RLS para goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view goals in their company" ON goals;
CREATE POLICY "Users can view goals in their company"
  ON goals FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can create their own goals" ON goals;
CREATE POLICY "Users can create their own goals"
  ON goals FOR INSERT
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (user_id = auth.uid());

-- RLS para achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view achievements in their company" ON achievements;
CREATE POLICY "Users can view achievements in their company"
  ON achievements FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
CREATE POLICY "Admins can manage achievements"
  ON achievements FOR ALL
  USING (has_role(auth.uid(), company_id, 'admin'));

-- RLS para user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert user achievements" ON user_achievements;
CREATE POLICY "System can insert user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- RLS para leaderboard
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view leaderboard in their company" ON leaderboard_snapshots;
CREATE POLICY "Users can view leaderboard in their company"
  ON leaderboard_snapshots FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

-- Inserir achievements padrão
INSERT INTO achievements (company_id, name, description, icon, criteria, points)
SELECT 
  id as company_id,
  'Primeiro Negócio',
  'Fechou seu primeiro negócio!',
  '🎯',
  '{"type": "deals_won", "count": 1}'::jsonb,
  100
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM achievements WHERE name = 'Primeiro Negócio'
);

INSERT INTO achievements (company_id, name, description, icon, criteria, points)
SELECT 
  id as company_id,
  'Vendedor Bronze',
  'Fechou 10 negócios',
  '🥉',
  '{"type": "deals_won", "count": 10}'::jsonb,
  500
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM achievements WHERE name = 'Vendedor Bronze'
);

INSERT INTO achievements (company_id, name, description, icon, criteria, points)
SELECT 
  id as company_id,
  'Vendedor Prata',
  'Fechou 50 negócios',
  '🥈',
  '{"type": "deals_won", "count": 50}'::jsonb,
  1000
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM achievements WHERE name = 'Vendedor Prata'
);

INSERT INTO achievements (company_id, name, description, icon, criteria, points)
SELECT 
  id as company_id,
  'Vendedor Ouro',
  'Fechou 100 negócios',
  '🥇',
  '{"type": "deals_won", "count": 100}'::jsonb,
  2500
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM achievements WHERE name = 'Vendedor Ouro'
);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();