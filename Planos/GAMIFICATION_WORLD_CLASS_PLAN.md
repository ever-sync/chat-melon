# 🏆 PLANO DE GAMIFICAÇÃO DE NÍVEL MUNDIAL
## Sistema de Gamificação Competitivo e Engajador para Atendentes

---

## 🎯 VISÃO GERAL

Criar um sistema de gamificação que seja **A MELHOR DO MUNDO** para equipes de vendas/atendimento, combinando:
- Notificações em tempo real de conquistas da equipe
- Competição saudável e motivadora
- Múltiplas camadas de engajamento
- Sistema de recompensas progressivo
- Analytics e insights comportamentais

---

## 📊 ESTADO ATUAL

### O que já existe:
- ✅ Tabelas: `goals`, `achievements`, `user_achievements`, `leaderboard_snapshots`
- ✅ Sistema básico de metas (receita, negócios, ligações, reuniões)
- ✅ Conquistas (achievements) com sistema de pontos
- ✅ Ranking mensal com top 10
- ✅ 3 abas: Metas, Conquistas, Ranking

### Limitações atuais:
- ❌ Sem notificações em tempo real
- ❌ Sem gamificação social (reações, comentários, celebrações)
- ❌ Sem sistema de níveis/experiência
- ❌ Sem desafios diários/semanais
- ❌ Sem recompensas tangíveis
- ❌ Sem streaks (sequências de dias)
- ❌ Sem batalhas/competições entre equipes
- ❌ Interface estática, sem animações ou celebrações

---

## 🚀 FUNCIONALIDADES WORLD-CLASS

### 1. **SISTEMA DE NOTIFICAÇÕES EM TEMPO REAL** 🔔

#### Feed de Atividades ao Vivo
```typescript
// Nova seção no topo da tela
interface LiveFeedEvent {
  type: 'achievement' | 'goal_completed' | 'streak' | 'level_up' | 'deal_won' | 'challenge_completed'
  user: User
  timestamp: Date
  data: {
    title: string
    description: string
    icon: string
    points?: number
    value?: number
  }
}
```

**Features:**
- 🎉 **Feed ao vivo** no topo da página mostrando conquistas em tempo real
- 🔊 **Notificações sonoras** customizáveis (pop, applause, fanfare)
- ✨ **Animações de confete** quando alguém completa uma meta importante
- 📢 **Toast notifications** quando colegas batem metas
- 🏅 **Celebrações da equipe** - botão para parabenizar colegas
- 💬 **Reações emoji** nas conquistas (🔥👏🎉💪⚡)

#### Implementação:
```sql
-- Nova tabela para eventos do feed
CREATE TABLE gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de reações
CREATE TABLE event_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES gamification_events(id),
  user_id UUID REFERENCES profiles(id),
  reaction TEXT NOT NULL, -- emoji
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id, reaction)
);
```

---

### 2. **SISTEMA DE NÍVEIS E EXPERIÊNCIA (XP)** 📈

#### Progressão de Carreira Gamificada
```typescript
interface UserLevel {
  level: number
  currentXP: number
  xpToNextLevel: number
  title: string // "Novato", "Vendedor", "Expert", "Mestre", "Lenda"
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master'
  perks: string[] // Benefícios desbloqueados
}

// Fórmula de XP: XP_needed = 100 * (level ^ 1.5)
// Nível 1: 100 XP
// Nível 2: 283 XP
// Nível 5: 1118 XP
// Nível 10: 3162 XP
```

**Ganho de XP:**
- 📞 Ligação realizada: 5 XP
- 💬 Mensagem respondida: 2 XP
- ✅ Deal criado: 20 XP
- 🎯 Deal fechado: 100 XP + (valor/100) XP
- 🏆 Meta batida: 500 XP
- 🔥 Streak de 7 dias: 200 XP
- ⭐ Conquista desbloqueada: XP da conquista

**Títulos por Nível:**
1. Novato (1-5)
2. Aprendiz (6-10)
3. Vendedor (11-15)
4. Profissional (16-20)
5. Expert (21-30)
6. Mestre (31-40)
7. Campeão (41-50)
8. Lenda (51+)

**Tiers com Cores:**
- 🥉 Bronze (1-10): #CD7F32
- 🥈 Prata (11-20): #C0C0C0
- 🥇 Ouro (21-30): #FFD700
- 💎 Platina (31-40): #E5E4E2
- 💠 Diamante (41-50): #B9F2FF
- 🌟 Master (51+): Gradiente arco-íris

---

### 3. **DESAFIOS DIÁRIOS E SEMANAIS** 🎯

#### Sistema de Desafios Rotativos
```typescript
interface Challenge {
  id: string
  type: 'daily' | 'weekly' | 'monthly' | 'special'
  title: string
  description: string
  objective: {
    type: 'calls' | 'deals' | 'revenue' | 'response_time' | 'messages' | 'streak'
    target: number
    current: number
  }
  reward: {
    xp: number
    points: number
    badge?: string
  }
  startDate: Date
  endDate: Date
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
}
```

**Exemplos de Desafios:**

**Diários:**
- ☀️ "Bom dia, Vendas!" - Faça 3 negócios antes do meio-dia (+50 XP)
- 🔥 "Sequência Quente" - Responda 10 mensagens em menos de 5 minutos (+30 XP)
- 🎯 "Precisão Cirúrgica" - Feche 2 deals hoje (+100 XP)
- 💰 "Caçador de Tesouros" - Atinja R$ 5.000 em vendas (+150 XP)

**Semanais:**
- 🏃 "Maratona de Vendas" - 20 deals fechados (+ 500 XP + Badge Especial)
- 👑 "Rei da Semana" - Seja o top 1 do ranking (+1000 XP)
- 🔥 "Streak Master" - 7 dias consecutivos com pelo menos 1 deal (+300 XP)
- 💎 "Alta Performance" - R$ 50.000 em vendas (+800 XP)

**Mensais:**
- 🌟 "Lenda do Mês" - Top 3 no ranking mensal (Badge + 2000 XP)
- 💯 "Centurião" - 100 deals fechados (+1500 XP)
- 🎖️ "Excelência" - Bata todas as suas metas (+3000 XP)

**Eventos Especiais:**
- 🎄 "Black Friday Warrior" - Meta especial em datas comemorativas
- ⚔️ "Battle Royale" - Competição entre times
- 🏆 "Championship Cup" - Torneio trimestral

---

### 4. **SISTEMA DE STREAKS (SEQUÊNCIAS)** 🔥

#### Incentivo de Consistência
```typescript
interface UserStreak {
  currentStreak: number // Dias consecutivos com atividade
  longestStreak: number // Recorde pessoal
  lastActivityDate: Date
  streakType: 'deals' | 'calls' | 'messages' | 'login'
  milestones: number[] // [7, 14, 30, 60, 90, 180, 365]
}
```

**Recompensas de Streak:**
- 🔥 7 dias: +200 XP + Badge "Semana Completa"
- 🔥🔥 14 dias: +500 XP + Badge "Duas Semanas"
- 🔥🔥🔥 30 dias: +1500 XP + Badge "Mês Perfeito" + Multiplicador 1.1x
- 🔥🔥🔥🔥 60 dias: +3000 XP + Badge "Imparável" + Multiplicador 1.2x
- 🔥🔥🔥🔥🔥 90 dias: +5000 XP + Badge "Lendário" + Multiplicador 1.5x

**Visual:**
- Indicador de chamas crescentes
- Contador proeminente no dashboard
- Alerta quando o streak está em risco (não teve atividade hoje)
- Hall da Fama dos maiores streaks

---

### 5. **BATALHAS E COMPETIÇÕES** ⚔️

#### Competição Saudável Entre Equipes/Indivíduos

**Tipos de Batalhas:**

1. **Duelos 1v1**
   - Desafie um colega para uma competição de 24h/7dias
   - Escolha a métrica (deals, valor, ligações)
   - Vencedor ganha XP bônus e badge

2. **Guerra de Equipes**
   - Divida a empresa em times (A vs B)
   - Competição semanal/mensal
   - Time vencedor ganha recompensas coletivas

3. **Torneios Eliminatórios**
   - Sistema de chaves (8, 16, 32 participantes)
   - Avanço por performance
   - Prêmios progressivos

**Implementação:**
```sql
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_type TEXT NOT NULL, -- '1v1', 'team', 'tournament'
  participants JSONB NOT NULL,
  metric TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  winner_id UUID,
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 6. **SISTEMA DE RECOMPENSAS E LOJA** 🏪

#### Economia Interna com Pontos

**Moeda Virtual: MelonCoins** 🍉

**Ganho de MelonCoins:**
- Converter XP em coins (100 XP = 1 coin)
- Bater metas diárias: 5 coins
- Top 10 semanal: 20-100 coins (baseado em posição)
- Conquistas especiais: 50-500 coins

**Loja de Recompensas:**
```typescript
interface StoreItem {
  id: string
  name: string
  description: string
  category: 'benefits' | 'customization' | 'powerups' | 'real_rewards'
  price: number // em MelonCoins
  icon: string
  stock?: number
}
```

**Itens da Loja:**

**Benefícios:**
- 🎨 Customização de perfil (molduras, badges especiais)
- 👤 Avatar exclusivo
- 🎯 Escolha da meta da semana
- 📊 Relatórios premium
- 🔊 Sons de notificação exclusivos

**Power-ups:**
- ⚡ XP Boost 2x por 24h (50 coins)
- 🎯 Multiplicador de pontos de meta (100 coins)
- 🛡️ Proteção de Streak (não perde se falhar 1 dia) (200 coins)
- 🔮 Revelar desafio do próximo dia (30 coins)

**Recompensas Reais:**
- ☕ Vale café/almoço (500 coins)
- 🏖️ Dia de folga extra (2000 coins)
- 💰 Bônus monetário (5000 coins)
- 🎁 Gift cards (variável)

---

### 7. **CONQUISTAS EXPANDIDAS** 🏅

#### Sistema de Achievements Robusto

**Categorias:**

**Progresso de Carreira:**
- 🎯 Primeira Venda
- 🎯 10 Vendas
- 🎯 50 Vendas
- 🎯 100 Vendas (Centurião)
- 🎯 500 Vendas (Lenda)
- 🎯 1000 Vendas (Deus das Vendas)

**Receita:**
- 💰 R$ 10k em vendas
- 💰 R$ 50k em vendas
- 💰 R$ 100k em vendas
- 💰 R$ 500k em vendas
- 💰 R$ 1M em vendas (Milionário)

**Velocidade:**
- ⚡ 5 deals em 1 dia (Velocista)
- ⚡ 10 deals em 1 dia (Flash)
- ⚡ Deal fechado em menos de 1h (Relâmpago)

**Consistência:**
- 🔥 Streak de 7 dias
- 🔥 Streak de 30 dias
- 🔥 Streak de 90 dias
- 🔥 Streak de 365 dias (Ano Perfeito)

**Social:**
- 👥 Ajudar 10 colegas (Mentor)
- 👥 50 reações em conquistas de outros
- 👥 Vencer 10 duelos

**Especiais/Raras:**
- 🌟 Primeiro lugar no ranking mensal
- 🌟 Hat-trick (3 deals seguidos em menos de 1h)
- 🌟 Deal de R$ 100k+ (Jackpot)
- 🌟 100% de metas batidas por 3 meses seguidos (Perfeição)

**Achievements Secretas:**
- ❓ Descobrir achievement secreta
- ❓ Trabalhar em dia de aniversário
- ❓ Fechar deal à meia-noite

---

### 8. **RANKINGS MÚLTIPLOS** 🏆

#### Diversos Leaderboards

**Tipos de Rankings:**

1. **Ranking Geral** (XP total)
2. **Ranking Mensal** (vendas)
3. **Ranking Semanal** (deals)
4. **Ranking de Streaks** (maior sequência)
5. **Ranking de Conquistas** (mais achievements)
6. **Ranking de Nível** (level + tier)
7. **Ranking de MelonCoins** (mais rico)
8. **Hall da Fama** (histórico de campeões)

**Features dos Rankings:**
- 🔍 Filtros por período (hoje, semana, mês, trimestre, ano, all-time)
- 📊 Comparação com a média da equipe
- 📈 Gráfico de evolução individual
- 🎯 Posição pessoal destacada
- 👀 Ver perfil de outros jogadores
- 🏅 Medalhas para top 3
- 📍 Indicador de subida/descida de posição

---

### 9. **PERFIL DO JOGADOR** 👤

#### Dashboard Pessoal Completo

**Seções do Perfil:**

```typescript
interface PlayerProfile {
  // Identidade
  avatar: string
  username: string
  level: number
  title: string
  tier: string

  // Estatísticas
  stats: {
    totalXP: number
    totalDeals: number
    totalRevenue: number
    winRate: number
    avgDealValue: number
    avgResponseTime: number
    currentStreak: number
    longestStreak: number
  }

  // Coleção
  achievements: Achievement[]
  badges: Badge[]

  // Histórico
  recentActivity: Activity[]
  monthlyProgress: ChartData

  // Social
  followers: number
  following: number
  battles: Battle[]
}
```

**Customização:**
- 🎨 Escolher cor de tema pessoal
- 🖼️ Moldura de avatar (desbloqueada por achievements)
- 🏷️ Badge principal exibido
- 📜 Bio/citação motivacional
- 🎵 Som de notificação personalizado

---

### 10. **ANALYTICS E INSIGHTS** 📊

#### Dashboard de Performance

**Métricas Visuais:**
- 📈 Gráfico de XP ganho por dia/semana/mês
- 📊 Distribuição de vendas por horário
- 🎯 Taxa de conversão de deals
- ⏱️ Tempo médio para fechar deal
- 🔥 Histórico de streaks
- 🏆 Progresso de conquistas (%)

**Comparações:**
- 👥 Você vs. Média da Equipe
- 📊 Você vs. Melhor Vendedor
- 📈 Evolução mês a mês
- 🎯 Previsão de atingimento de meta

**Insights com IA:**
- 💡 "Você vende 30% melhor pela manhã"
- 💡 "Seus melhores dias são terças e quartas"
- 💡 "Você está 15% acima da média da equipe"
- 💡 "Continue assim e vai bater a meta em 18 dias"

---

### 11. **NOTIFICAÇÕES INTELIGENTES** 🔔

#### Sistema de Alertas Motivacionais

**Tipos de Notificações:**

**Celebrações:**
- 🎉 "João acabou de fechar um deal de R$ 50.000!"
- 🏆 "Maria bateu a meta mensal!"
- 🔥 "Pedro completou 30 dias de streak!"
- ⬆️ "Ana subiu para nível 25 - Expert!"

**Motivacionais:**
- 💪 "Você está a 2 deals de bater sua meta!"
- 🎯 "Faltam apenas R$ 5.000 para seu recorde!"
- ⚠️ "Seu streak está em risco! Faça 1 deal hoje"
- 🚀 "Você está no top 5! Continue assim!"

**Competitivas:**
- ⚔️ "João te ultrapassou no ranking!"
- 🏁 "Você está 1 deal atrás do líder!"
- 🎖️ "Nova batalha disponível: aceite o desafio!"

**Desafios:**
- 🌅 "Novo desafio diário disponível!"
- 🎁 "Desafio especial de fim de semana!"
- ⏰ "Último dia do desafio semanal!"

---

### 12. **ELEMENTOS VISUAIS DE ALTO IMPACTO** ✨

#### UX/UI de Nível Premium

**Animações:**
- 🎊 Confete quando bater meta
- ⭐ Estrelas voando ao ganhar XP
- 🎆 Fogos ao subir de nível
- 💥 Explosão ao desbloquear achievement
- 🌈 Arco-íris ao chegar no top 3

**Sons:**
- 🔊 "Ka-ching!" ao fechar deal
- 🔔 Sino ao ganhar achievement
- 🎺 Fanfarra ao subir de nível
- 👏 Aplausos quando outros reagem
- 🏆 Tema de vitória ao bater meta

**Micro-interações:**
- ✨ Hover effects nas badges
- 🎯 Progress bars animadas
- 💫 Partículas ao clicar
- 🌟 Glow effect em conquistas
- 📈 Números contando progressivamente

**Modo Escuro:**
- 🌙 Tema dark otimizado
- 🎨 Cores néon para gamificação
- ✨ Efeitos de luz mais pronunciados

---

## 🗂️ NOVA ESTRUTURA DE BANCO DE DADOS

### Tabelas Adicionais Necessárias:

```sql
-- Níveis e XP
CREATE TABLE user_levels (
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
CREATE TABLE user_streaks (
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
CREATE TABLE challenges (
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
CREATE TABLE user_challenges (
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
CREATE TABLE battles (
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
CREATE TABLE user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de transações
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- earn, spend
  source TEXT NOT NULL, -- xp_conversion, achievement, purchase, etc
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loja de recompensas
CREATE TABLE store_items (
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
CREATE TABLE user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES store_items(id),
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, redeemed, expired
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ
);

-- Feed de eventos
CREATE TABLE gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar eventos recentes
CREATE INDEX idx_gamification_events_company_date
  ON gamification_events(company_id, created_at DESC);

-- Reações em eventos
CREATE TABLE event_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES gamification_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id, reaction)
);

-- Customização de perfil
CREATE TABLE user_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  theme_color TEXT,
  avatar_frame TEXT,
  primary_badge UUID REFERENCES achievements(id),
  bio TEXT,
  notification_sound TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 NOVA ESTRUTURA DE COMPONENTES

```
src/
├── pages/
│   └── Gamification.tsx (atualizado)
│
├── components/gamification/
│   ├── LiveFeed.tsx              [NOVO] Feed de atividades em tempo real
│   ├── UserLevelCard.tsx         [NOVO] Card de nível e XP
│   ├── StreakTracker.tsx         [NOVO] Contador de streaks
│   ├── DailyChallenges.tsx       [NOVO] Lista de desafios
│   ├── BattleArena.tsx           [NOVO] Sistema de batalhas
│   ├── RewardsStore.tsx          [NOVO] Loja de recompensas
│   ├── PlayerProfile.tsx         [NOVO] Perfil completo do jogador
│   ├── LeaderboardMulti.tsx      [NOVO] Rankings múltiplos
│   ├── AchievementUnlocked.tsx   [NOVO] Modal de conquista desbloqueada
│   ├── LevelUpModal.tsx          [NOVO] Celebração de subida de nível
│   ├── NotificationToast.tsx     [NOVO] Toast personalizado
│   ├── ProgressChart.tsx         [NOVO] Gráficos de progresso
│   ├── GoalTracker.tsx           [EXISTENTE] (manter)
│   └── AchievementsBadges.tsx    [EXISTENTE] (expandir)
│
├── hooks/
│   ├── useGamification.ts        [EXISTENTE] (expandir)
│   ├── useLiveEvents.ts          [NOVO] WebSocket/Realtime para eventos
│   ├── useLevel.ts               [NOVO] Gerenciar XP e níveis
│   ├── useStreaks.ts             [NOVO] Sistema de streaks
│   ├── useChallenges.ts          [NOVO] Desafios
│   ├── useBattles.ts             [NOVO] Batalhas
│   └── useRewards.ts             [NOVO] Loja e moedas
│
└── lib/
    └── gamification/
        ├── xpCalculator.ts       [NOVO] Fórmulas de XP
        ├── levelSystem.ts        [NOVO] Sistema de níveis
        ├── achievementEngine.ts  [NOVO] Motor de conquistas
        ├── challengeGenerator.ts [NOVO] Gerador de desafios
        └── notifications.ts      [NOVO] Sistema de notificações
```

---

## 🔄 FLUXO DE EVENTOS EM TEMPO REAL

### Utilizando Supabase Realtime:

```typescript
// Hook para eventos ao vivo
export const useLiveEvents = () => {
  const [events, setEvents] = useState<GamificationEvent[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('gamification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gamification_events'
        },
        (payload) => {
          const newEvent = payload.new as GamificationEvent

          // Adicionar ao feed
          setEvents(prev => [newEvent, ...prev].slice(0, 50))

          // Tocar som
          playNotificationSound(newEvent.event_type)

          // Mostrar toast
          showEventToast(newEvent)

          // Confete para eventos especiais
          if (shouldCelebrate(newEvent)) {
            triggerConfetti()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { events }
}
```

---

## 📱 LAYOUT DA TELA PRINCIPAL

### Nova Estrutura da Página:

```
┌─────────────────────────────────────────────────────────┐
│  🏆 GAMIFICAÇÃO                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │  Seu Perfil     │  │  Feed ao Vivo               │ │
│  │  Nível 23 ⭐    │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  2,450 / 3,000  │  │  🎉 João bateu a meta!      │ │
│  │  [████████░░]   │  │  🏆 Maria chegou nível 30   │ │
│  │                 │  │  🔥 Pedro: 15 dias streak   │ │
│  │  🔥 Streak: 12  │  │  💰 Ana: Deal de R$ 80k     │ │
│  │  🪙 1,250 coins │  └──────────────────────────────┘ │
│  └─────────────────┘                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Desafios de Hoje                               │   │
│  │  ✅ 3 deals fechados (3/3) .............. +50XP │   │
│  │  ⏳ R$ 10k em vendas (7k/10k) .......... +100XP │   │
│  │  ⬜ 15 ligações (8/15) .................. +30XP │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── TABS ───────────────────────────────────────┐   │
│  │  📊 Metas  🏆 Conquistas  👑 Rankings  ⚔️ Batt │   │
│  └───────────────────────────────────────────────┘   │
│                                                         │
│  [Conteúdo da aba selecionada]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 FASES DE IMPLEMENTAÇÃO

### **FASE 1: FUNDAÇÃO** (Semana 1-2)
- [ ] Criar novas tabelas no Supabase
- [ ] Implementar sistema de XP e níveis
- [ ] Criar hook `useLevel`
- [ ] Componente `UserLevelCard`
- [ ] Sistema básico de eventos
- [ ] Tabela `gamification_events`

### **FASE 2: NOTIFICAÇÕES E FEED** (Semana 2-3)
- [ ] Setup Supabase Realtime
- [ ] Hook `useLiveEvents`
- [ ] Componente `LiveFeed`
- [ ] Sistema de Toast notifications
- [ ] Integração com sons
- [ ] Sistema de reações

### **FASE 3: DESAFIOS E STREAKS** (Semana 3-4)
- [ ] Sistema de streaks
- [ ] Hook `useStreaks`
- [ ] Componente `StreakTracker`
- [ ] Gerador de desafios
- [ ] Componente `DailyChallenges`
- [ ] Auto-verificação de desafios

### **FASE 4: CONQUISTAS EXPANDIDAS** (Semana 4-5)
- [ ] Adicionar 50+ novas conquistas
- [ ] Sistema de conquistas secretas
- [ ] Melhorar `AchievementsBadges`
- [ ] Modal `AchievementUnlocked`
- [ ] Categorias de conquistas

### **FASE 5: BATALHAS** (Semana 5-6)
- [ ] Sistema de batalhas 1v1
- [ ] Componente `BattleArena`
- [ ] Lógica de matchmaking
- [ ] Guerra de equipes
- [ ] Sistema de torneios

### **FASE 6: ECONOMIA E LOJA** (Semana 6-7)
- [ ] Sistema de MelonCoins
- [ ] Hook `useRewards`
- [ ] Componente `RewardsStore`
- [ ] Itens da loja
- [ ] Sistema de compras
- [ ] Resgate de recompensas

### **FASE 7: RANKINGS MÚLTIPLOS** (Semana 7-8)
- [ ] Expandir sistema de leaderboard
- [ ] Componente `LeaderboardMulti`
- [ ] Rankings por categoria
- [ ] Hall da Fama
- [ ] Histórico de campeões

### **FASE 8: PERFIL E ANALYTICS** (Semana 8-9)
- [ ] Componente `PlayerProfile`
- [ ] Sistema de customização
- [ ] Gráficos de progresso
- [ ] Insights com IA
- [ ] Comparações

### **FASE 9: POLISH E UX** (Semana 9-10)
- [ ] Animações e micro-interações
- [ ] Sistema de sons
- [ ] Confete e celebrações
- [ ] Modal `LevelUpModal`
- [ ] Modo escuro otimizado
- [ ] Performance optimization

### **FASE 10: TESTES E LANÇAMENTO** (Semana 10-11)
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Balanceamento de XP/rewards
- [ ] Documentação
- [ ] Onboarding para usuários
- [ ] 🚀 LANÇAMENTO

---

## 💡 IDEIAS EXTRAS DIFERENCIADORAS

### 1. **Boss Fights** 🐉
Metas épicas mensais onde toda a equipe se une para derrotar um "boss" (meta coletiva gigante). Progresso em tempo real, recompensas massivas para todos.

### 2. **Mapa de Progresso** 🗺️
Jornada visual tipo RPG onde você avança em um mapa conforme sobe de nível. Cada região tem desafios únicos.

### 3. **Clãs/Guildas** 🛡️
Grupos dentro da empresa que competem entre si. Chat de clã, metas coletivas, banner personalizado.

### 4. **Temporadas** 🌟
Sistema de temporadas trimestrais com reset parcial, temas exclusivos, conquistas temporárias e recompensas limitadas.

### 5. **Mentoria Gamificada** 👨‍🏫
Veteranos ganham XP por ajudar novatos. Sistema de "aprendiz" com metas compartilhadas.

### 6. **Easter Eggs** 🥚
Conquistas secretas escondidas que só podem ser descobertas fazendo ações específicas e inusitadas.

### 7. **Predicções e Apostas** 🎲
Aposte coins em quem vai ser o campeão da semana. Previsões corretas multiplicam seus coins.

### 8. **Replay System** 📹
Ver o "replay" de como você bateu uma meta importante, com estatísticas detalhadas.

### 9. **Modo Competitivo Ranqueado** 🎮
Sistema tipo jogos competitivos com divisões (Bronze, Prata, Ouro, etc.) e promoção/rebaixamento.

### 10. **Achievements Colaborativos** 🤝
Conquistas que só podem ser desbloqueadas em grupo (ex: "5 pessoas batem meta no mesmo dia").

---

## 🎨 PALETA DE CORES SUGERIDA

```css
/* Tiers */
--bronze: #CD7F32
--silver: #C0C0C0
--gold: #FFD700
--platinum: #E5E4E2
--diamond: #B9F2FF
--master: linear-gradient(45deg, #f093fb 0%, #f5576c 100%)

/* Gamificação */
--xp-bar: #3b82f6
--streak-fire: #ef4444
--coin-gold: #fbbf24
--achievement-purple: #a855f7
--battle-red: #dc2626
--success-green: #22c55e
```

---

## 📈 MÉTRICAS DE SUCESSO

Para considerar a gamificação um sucesso, devemos medir:

1. **Engajamento**
   - Taxa de login diário aumentou
   - Tempo médio na plataforma aumentou
   - Interações entre usuários aumentaram

2. **Performance**
   - Número de deals fechados aumentou
   - Valor médio de deals aumentou
   - Tempo de resposta diminuiu

3. **Retenção**
   - Taxa de churn diminuiu
   - Funcionários completam onboarding mais rápido
   - Satisfação da equipe aumentou

4. **Adoção**
   - % de usuários ativos na gamificação
   - Achievements desbloqueados por usuário
   - Participação em desafios e batalhas

---

## 🚀 DIFERENCIAIS COMPETITIVOS

O que torna ESTA gamificação a MELHOR DO MUNDO:

✨ **Notificações em Tempo Real** - Ninguém fica de fora das celebrações
🔥 **Sistema de Streaks** - Incentiva consistência diária
⚔️ **Batalhas e Competições** - Competição saudável e engajadora
🎯 **Desafios Rotativos** - Sempre algo novo para fazer
💰 **Economia Real** - Recompensas tangíveis que importam
📊 **Analytics Profundos** - Insights acionáveis
🎨 **UX Premium** - Animações e celebrações de alto nível
👥 **Social Primeiro** - Gamificação é sobre a equipe
🎮 **Múltiplas Camadas** - Casual a hardcore, todos se divertem
🌟 **Progressão Satisfatória** - Sempre algo para desbloquear

---

## 📝 CONCLUSÃO

Este plano cria um sistema de gamificação que vai além de rankings simples. É uma experiência completa que:

- **Motiva** através de recompensas progressivas
- **Engaja** com notificações e eventos em tempo real
- **Conecta** a equipe através de competições e celebrações
- **Retém** com progressão e desbloqueáveis
- **Performa** com analytics e insights

A implementação completa vai transformar a rotina de trabalho em uma experiência épica, onde cada venda é uma conquista, cada meta é uma batalha vencida, e cada dia é uma oportunidade de subir no ranking.

**Isso não é apenas gamificação. É uma revolução na forma como sua equipe trabalha.** 🚀
