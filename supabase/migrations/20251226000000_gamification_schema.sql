-- Níveis e XP
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  title TEXT DEFAULT 'Novato',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  streak_type TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  milestones_reached INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Desafios
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type TEXT NOT NULL, -- daily, weekly, monthly, special
  title TEXT NOT NULL,
  description TEXT,
  objective JSONB NOT NULL,
  reward JSONB NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progresso em desafios
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  challenge_id UUID REFERENCES challenges(id),
  progress JSONB DEFAULT '{"current": 0}',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Batalhas
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  battle_type TEXT NOT NULL, -- 1v1, team, tournament
  participants JSONB NOT NULL,
  metric TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  winner_id UUID,
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moeda virtual (MelonCoins)
CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de transações
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- earn, spend
  source TEXT NOT NULL, -- xp_conversion, achievement, purchase, etc
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loja de recompensas
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  icon TEXT,
  stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compras dos usuários
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES store_items(id),
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, redeemed, expired
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ
);

-- Feed de eventos
CREATE TABLE IF NOT EXISTS gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar eventos recentes
CREATE INDEX IF NOT EXISTS idx_gamification_events_company_date
  ON gamification_events(company_id, created_at DESC);

-- Reações em eventos
CREATE TABLE IF NOT EXISTS event_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES gamification_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id, reaction)
);

-- Customização de perfil
CREATE TABLE IF NOT EXISTS user_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  theme_color TEXT,
  avatar_frame TEXT,
  primary_badge UUID REFERENCES achievements(id),
  bio TEXT,
  notification_sound TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
