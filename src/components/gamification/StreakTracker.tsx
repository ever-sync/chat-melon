
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { UserStreak } from "@/types/gamification";

interface StreakTrackerProps {
  streak: UserStreak;
}

export function StreakTracker({ streak }: StreakTrackerProps) {
  const { currentStreak, longestStreak } = streak;

  // Determine flame intensity/color based on streak
  const getFlameColor = (count: number) => {
      if (count >= 30) return "text-purple-600 drop-shadow-[0_0_10px_rgba(147,51,234,0.6)]";
      if (count >= 14) return "text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]";
      if (count >= 7) return "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]";
      if (count > 0) return "text-yellow-500";
      return "text-gray-300";
  };

  return (
    <Card className="bg-gradient-to-br from-background to-orange-50/50 dark:to-orange-950/20 border-orange-200/50 dark:border-orange-900/50">
      <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
        <div className="relative group cursor-help">
             <Flame 
                className={`w-16 h-16 transition-all duration-500 ${getFlameColor(currentStreak)} ${currentStreak > 0 ? 'animate-pulse' : ''}`} 
                fill={currentStreak > 0 ? "currentColor" : "none"}
                strokeWidth={1.5}
             />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-background font-black text-xl select-none pointer-events-none mix-blend-overlay">
                 {currentStreak}
             </div>
        </div>
        
        <div className="text-center space-y-1">
            <h3 className="font-bold text-xl leading-none font-heading">{currentStreak} Dias</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sequência em Chamas</p>
        </div>

        <div className="flex gap-1.5 mt-1 justify-center">
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < (currentStreak % 5) || (currentStreak > 0 && currentStreak % 5 === 0) ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
            ))}
        </div>
        
        <div className="text-[10px] font-medium px-2 py-1 bg-muted/50 rounded-full text-muted-foreground">
             Recorde Pessoal: <span className="text-foreground">{longestStreak}</span>
        </div>
      </CardContent>
    </Card>
  );
}
