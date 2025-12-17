import { MainLayout } from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalTracker } from '@/components/gamification/GoalTracker';
import { AchievementsBadges } from '@/components/gamification/AchievementsBadges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Award } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

const Gamification = () => {
  const { leaderboard, userAchievements } = useGamification();

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gamificação</h1>
            <p className="text-muted-foreground">Acompanhe suas metas e conquistas</p>
          </div>
          <Card className="w-40">
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Pontos Totais</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="goals" className="space-y-4">
          <TabsList>
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
          </TabsList>

          <TabsContent value="goals">
            <GoalTracker />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementsBadges />
          </TabsContent>

          <TabsContent value="leaderboard">
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
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Gamification;
