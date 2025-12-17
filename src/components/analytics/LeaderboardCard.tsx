import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal } from 'lucide-react';
import { UserRanking } from '@/hooks/useAnalytics';

interface LeaderboardCardProps {
  data: UserRanking[];
}

export const LeaderboardCard = ({ data }: LeaderboardCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Vendedores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((user, index) => (
            <div
              key={user.user_id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 text-center font-bold text-muted-foreground">
                  {index < 3 ? getMedalIcon(index) : `${index + 1}º`}
                </div>
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.user_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.deals_count} {user.deals_count === 1 ? 'negócio' : 'negócios'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatCurrency(user.total_value)}</p>
                <p className="text-sm text-muted-foreground">
                  Média: {formatCurrency(user.avg_value)}
                </p>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Nenhum vendedor com negócios fechados ainda
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
