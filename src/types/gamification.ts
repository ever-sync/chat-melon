
export interface LiveFeedEvent {
  type: 'achievement' | 'goal_completed' | 'streak' | 'level_up' | 'deal_won' | 'challenge_completed';
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  timestamp: Date;
  data: {
    title: string;
    description: string;
    icon: string;
    points?: number;
    value?: number;
  };
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  title: string; // "Novato", "Vendedor", "Expert", "Mestre", "Lenda"
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  perks: string[]; // Benefícios desbloqueados
}

export interface Challenge {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  title: string;
  description: string;
  objective: {
    type: 'calls' | 'deals' | 'revenue' | 'response_time' | 'messages' | 'streak';
    target: number;
    current: number;
  };
  reward: {
    xp: number;
    points: number;
    badge?: string;
  };
  startDate: Date;
  endDate: Date;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  isCompleted?: boolean;
}

export interface UserStreak {
  currentStreak: number; // Dias consecutivos com atividade
  longestStreak: number; // Recorde pessoal
  lastActivityDate: Date;
  streakType: 'deals' | 'calls' | 'messages' | 'login';
  milestones: number[]; // [7, 14, 30, 60, 90, 180, 365]
}

export interface Battle {
  id: string;
  battle_type: '1v1' | 'team' | 'tournament';
  participants: {
    id: string;
    name: string;
    avatar: string;
    score: number;
  }[];
  metric: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'pending';
  winner_id?: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  category: 'benefits' | 'customization' | 'powerups' | 'real_rewards';
  price: number; // em MelonCoins
  icon: string;
  stock?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface Badge {
  id: string;
  name: string;
  imageUrl: string;
  unlockedAt?: Date;
}

export interface PlayerProfile {
  // Identidade
  avatar: string;
  username: string;
  level: number;
  title: string;
  tier: string;

  // Estatísticas
  stats: {
    totalXP: number;
    totalDeals: number;
    totalRevenue: number;
    winRate: number;
    avgDealValue: number;
    avgResponseTime: number;
    currentStreak: number;
    longestStreak: number;
  };

  // Coleção
  achievements: Achievement[];
  badges: Badge[];

  // Histórico
  // recentActivity: Activity[];
  // monthlyProgress: ChartData;

  // Social
  followers: number;
  following: number;
  battles: Battle[];
}

export interface GamificationEvent {
    id: string;
    company_id: string;
    user_id: string;
    event_type: string;
    event_data: any;
    is_public: boolean;
    created_at: string;
}
