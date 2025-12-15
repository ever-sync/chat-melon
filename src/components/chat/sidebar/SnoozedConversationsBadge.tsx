import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlarmClock, Clock, X } from 'lucide-react';
import { useSnooze } from '@/hooks/chat/useSnooze';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SnoozedConversationsBadgeProps {
  onSelectConversation?: (conversationId: string) => void;
}

export const SnoozedConversationsBadge = ({
  onSelectConversation,
}: SnoozedConversationsBadgeProps) => {
  const [open, setOpen] = useState(false);
  const { snoozedCount, snoozedConversations, unsnooze } = useSnooze();

  if (snoozedCount === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUnsnooze = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await unsnooze.mutateAsync(conversationId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 relative',
            snoozedCount > 0 && 'border-amber-500/50 text-amber-600 hover:text-amber-700'
          )}
        >
          <AlarmClock className="h-4 w-4" />
          <span className="hidden sm:inline">Adiadas</span>
          <Badge
            variant="secondary"
            className="h-5 min-w-5 px-1.5 bg-amber-100 text-amber-700"
          >
            {snoozedCount}
          </Badge>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 font-medium">
            <AlarmClock className="h-4 w-4 text-amber-500" />
            Conversas Adiadas
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estas conversas reaparecerão automaticamente no horário programado
          </p>
        </div>

        <ScrollArea className="max-h-96">
          <div className="p-2 space-y-1">
            {snoozedConversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer group"
                onClick={() => {
                  onSelectConversation?.(conv.id);
                  setOpen(false);
                }}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
                    {getInitials(conv.contact_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {conv.contact_name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(conv.snoozed_until), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                  {conv.snooze_reason && (
                    <div className="text-xs text-muted-foreground truncate">
                      {conv.snooze_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(conv.snoozed_until), 'HH:mm')}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleUnsnooze(conv.id, e)}
                    title="Reativar agora"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {snoozedConversations.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <AlarmClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conversa adiada</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
