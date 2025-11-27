import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Lock } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

export const AchievementsBadges = () => {
  const { achievements, userAchievements, isLoading } = useGamification();

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Conquistas</h2>
        <Badge variant="secondary">
          {userAchievements.length}/{achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {achievements.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <TooltipProvider key={achievement.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:scale-105",
                      unlocked ? "border-primary shadow-lg" : "opacity-50 grayscale"
                    )}
                  >
                    <CardContent className="pt-6 text-center space-y-2">
                      <div className="text-4xl mb-2">
                        {unlocked ? achievement.icon : <Lock className="w-10 h-10 mx-auto text-muted-foreground" />}
                      </div>
                      <p className="font-semibold text-sm">{achievement.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {achievement.points} pts
                      </Badge>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {unlocked && userAchievements.find(ua => ua.achievement_id === achievement.id) && (
                      <p className="text-xs text-primary">
                        Desbloqueado em{' '}
                        {new Date(
                          userAchievements.find(ua => ua.achievement_id === achievement.id)!.earned_at
                        ).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};
