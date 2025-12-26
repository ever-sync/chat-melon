
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap } from "lucide-react";
import { UserLevel } from "@/types/gamification";

interface UserLevelCardProps {
  userLevel: UserLevel;
}

export function UserLevelCard({ userLevel }: UserLevelCardProps) {
  const { level, currentXP, xpToNextLevel, title, tier } = userLevel;
  const progress = (currentXP / xpToNextLevel) * 100;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-700 text-white';
      case 'silver': return 'bg-slate-400 text-white';
      case 'gold': return 'bg-yellow-500 text-black';
      case 'platinum': return 'bg-slate-300 text-black border-2 border-slate-400';
      case 'diamond': return 'bg-cyan-200 text-cyan-900 border-2 border-cyan-400';
      case 'master': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <Card className="w-full relative overflow-hidden border-2 border-primary/10">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Trophy size={100} />
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {level}
          </span>
          {title}
        </CardTitle>
        <Badge className={getTierColor(tier)} variant="secondary">
          {tier.toUpperCase()}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> {currentXP} XP</span>
            <span className="flex items-center gap-1">{xpToNextLevel} XP <Star size={14} className="text-yellow-500" /></span>
          </div>
          
          <div className="relative pt-1">
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-center mt-1 text-muted-foreground">
              Faltam {xpToNextLevel - currentXP} XP para o próximo nível
            </p>
          </div>

          {userLevel.perks.length > 0 && (
            <div className="pt-2 border-t mt-2">
              <p className="text-xs font-semibold mb-1 text-muted-foreground">Benefícios Ativos:</p>
              <div className="flex flex-wrap gap-1">
                {userLevel.perks.map((perk, index) => (
                  <Badge key={index} variant="outline" className="text-[10px] h-5">
                    {perk}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
