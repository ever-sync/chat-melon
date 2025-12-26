
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { Challenge } from "@/types/gamification";

interface DailyChallengesProps {
    challenges: Challenge[];
}

export function DailyChallenges({ challenges }: DailyChallengesProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Desafios do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {challenges.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Sem desafios ativos no momento.</p>
                ) : (
                    challenges.map(challenge => {
                        const progress = Math.min((challenge.objective.current / challenge.objective.target) * 100, 100);
                        return (
                            <div key={challenge.id} className="flex flex-col gap-2 p-3 bg-muted/40 rounded-lg group hover:bg-muted/60 transition-colors">
                                <div className="flex justify-between items-start">
                                     <div className="flex items-center gap-2">
                                        {challenge.isCompleted ? <CheckCircle2 className="text-green-500" size={18} /> : <Circle className="text-muted-foreground" size={18} />}
                                        <span className={`text-sm ${challenge.isCompleted ? "line-through text-muted-foreground" : "font-medium"}`}>{challenge.title}</span>
                                     </div>
                                     <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-900 ml-2 whitespace-nowrap">
                                        +{challenge.reward.xp} XP
                                     </Badge>
                                </div>
                                <div className="pl-6 md:pl-7">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>{challenge.description}</span>
                                        <span>{challenge.objective.current} / {challenge.objective.target}</span>
                                    </div>
                                    <Progress value={progress} className="h-2 bg-muted-foreground/20" indicatorClassName={challenge.isCompleted ? "bg-green-500" : "bg-primary"} />
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
