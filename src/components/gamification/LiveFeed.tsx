
import React from 'react';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Flame, ChevronUp, Briefcase } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LiveFeedProps {
  companyId: string;
}

export function LiveFeed({ companyId }: LiveFeedProps) {
  const { events } = useLiveEvents(companyId);

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="text-yellow-500" size={16} />;
      case 'goal_completed': return <Target className="text-green-500" size={16} />;
      case 'streak': return <Flame className="text-orange-500" size={16} />;
      case 'level_up': return <ChevronUp className="text-blue-500" size={16} />;
      case 'deal_won': return <Briefcase className="text-purple-500" size={16} />;
      default: return <Trophy className="text-gray-500" size={16} />;
    }
  };

  return (
    <Card className="h-full flex flex-col border-primary/20 bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Feed ao Vivo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[300px] sm:h-[400px] w-full px-4">
          <div className="space-y-4 py-4">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground opacity-50">
                 <Trophy className="mb-2 h-8 w-8" />
                 <p className="text-sm">Aguardando novas conquistas...</p>
              </div>
            ) : (
                events.map((event, index) => (
                  <div key={index} className="flex gap-3 items-start animate-in slide-in-from-right fade-in duration-500">
                    <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
                      <AvatarImage src={event.user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {event.user.name.substring(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                         <p className="text-sm font-semibold leading-none text-foreground">{event.user.name}</p>
                         <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(event.timestamp, { addSuffix: true, locale: ptBR })}
                         </span>
                      </div>
                      <div className="flex items-start gap-1 text-sm bg-muted/40 p-2 rounded-md">
                        <div className="mt-0.5 min-w-4 max-w-4">{getIcon(event.type)}</div>
                        <div className="flex flex-col">
                            <span className="text-sm text-foreground/90">{event.data.title}</span>
                            <span className="text-xs text-muted-foreground">{event.data.description}</span>
                        </div>
                      </div>
                      {event.data.points && (
                          <div className="flex justify-end">
                            <Badge variant="secondary" className="text-[10px] h-5 bg-yellow-500/10 text-yellow-600 border-yellow-200">
                                +{event.data.points} XP
                            </Badge>
                          </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
