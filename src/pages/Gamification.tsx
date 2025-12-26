import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalTracker } from '@/components/gamification/GoalTracker';
import { AchievementsBadges } from '@/components/gamification/AchievementsBadges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Target, Award, Sparkles, Map, Store } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { UserLevelCard } from '@/components/gamification/UserLevelCard';
import { LiveFeed } from '@/components/gamification/LiveFeed';
import { StreakTracker } from '@/components/gamification/StreakTracker';
import { DailyChallenges } from '@/components/gamification/DailyChallenges';
import { UserLevel, UserStreak, Challenge } from '@/types/gamification';

// Mock data for new features until backend is fully connected
const mockUserLevel: UserLevel = {
  level: 12,
  currentXP: 2450,
  xpToNextLevel: 3000,
  title: "Vendedor Pro",
  tier: "silver",
  perks: ["Relatórios Avançados", "Badge Exclusiva"]
};

const mockStreak: UserStreak = {
  currentStreak: 12,
  longestStreak: 15,
  lastActivityDate: new Date(),
  streakType: 'deals',
  milestones: [7, 14, 30]
};

const mockChallenges: Challenge[] = [
    {
        id: "1",
        type: 'daily',
        title: "Bom dia, Vendas!",
        description: "Faça 3 negócios antes do meio-dia",
        objective: { type: 'deals', target: 3, current: 1 },
        reward: { xp: 50, points: 10 },
        startDate: new Date(),
        endDate: new Date(),
        difficulty: 'easy',
        isCompleted: false
    },
    {
        id: "2",
        type: 'daily',
        title: "Sequência Quente",
        description: "Responda 10 mensagens em 5 min",
        objective: { type: 'messages', target: 10, current: 10 },
        reward: { xp: 30, points: 5 },
        startDate: new Date(),
        endDate: new Date(),
        difficulty: 'medium',
        isCompleted: true
    },
    {
        id: "3",
        type: 'daily',
        title: "Precisão Cirúrgica",
        description: "Feche 2 deals hoje",
        objective: { type: 'deals', target: 2, current: 0 },
        reward: { xp: 100, points: 20 },
        startDate: new Date(),
        endDate: new Date(),
        difficulty: 'hard',
        isCompleted: false
    }
];

const Gamification = () => {
  // Existing hook
  const { leaderboard, userAchievements } = useGamification();

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}º`;
  };

  const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievements.points || 0), 0);

  // Todo: get real company ID
  const companyId = "placeholder-company-id"; 

  return (
    <MainLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="text-yellow-500" fill="currentColor" />
              Gamificação
            </h1>
            <p className="text-muted-foreground">Evolua sua carreira, conquiste prêmios e bata metas!</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-muted/50 rounded-full px-4 py-2 flex items-center gap-2 border">
                <span className="text-xl">🍉</span>
                <span className="font-bold">1,250 Coins</span>
             </div>
          </div>
        </div>

        {/* Top Section: Profile & Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player Stats */}
          <div className="lg:col-span-4 space-y-6">
             <UserLevelCard userLevel={mockUserLevel} />
             <div className="grid grid-cols-2 gap-4">
                <StreakTracker streak={mockStreak} />
                <Card className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50">
                    <Trophy className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{totalPoints}</p>
                    <p className="text-xs text-muted-foreground">Pontos Totais</p>
                </Card>
             </div>
          </div>

          {/* Right Column: Live Feed & Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-6">
             <LiveFeed companyId={companyId} />
             
             {/* Tabs System */}
             <Tabs defaultValue="goals" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="goals" className="gap-2">
                  <Target className="w-4 h-4" />
                  Metas
                </TabsTrigger>
                <TabsTrigger value="achievements" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  Conquistas
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2">
                  <Award className="w-4 h-4" />
                  Ranking
                </TabsTrigger>
                <TabsTrigger value="challenges" className="gap-2">
                  <Map className="w-4 h-4" />
                  Desafios
                </TabsTrigger>
                <TabsTrigger value="store" className="gap-2">
                  <Store className="w-4 h-4" />
                  Loja
                </TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="mt-4">
                <GoalTracker />
              </TabsContent>

              <TabsContent value="achievements" className="mt-4">
                <AchievementsBadges />
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ranking do Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboard.map((entry: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-2xl w-12 text-center">{getMedalIcon(index + 1)}</div>
                          <Avatar>
                            <AvatarImage src={entry.user?.avatar_url} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {getInitials(entry.user?.full_name || 'User')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{entry.user?.full_name || 'Usuário'}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.dealsCount} negócios fechados
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(entry.totalValue)}</p>
                          </div>
                        </div>
                      ))}

                      {leaderboard.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma venda registrada este mês</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="challenges" className="mt-4">
                  <DailyChallenges challenges={mockChallenges} />
              </TabsContent>

              <TabsContent value="store" className="mt-4">
                  <Card className="p-8 text-center text-muted-foreground">
                      <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>Loja de recompensas em breve!</p>
                  </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Gamification;
