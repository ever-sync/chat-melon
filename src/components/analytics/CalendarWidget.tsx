import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, ExternalLink, CheckCircle2 } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useTasks } from "@/hooks/crm/useTasks";
import { Button } from "@/components/ui/button";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const CalendarWidget = () => {
  const { connectionStatus, todayEvents, isLoadingEvents } = useGoogleCalendar();
  const { tasks } = useTasks({
    status: "pending",
    dateFrom: format(new Date(), "yyyy-MM-dd"),
    dateTo: format(new Date(), "yyyy-MM-dd"),
  });

  if (!connectionStatus?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Agenda do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Google Calendar não conectado</p>
              <p className="text-xs text-muted-foreground">
                Conecte em Configurações → Integrações
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combina eventos do Calendar e tarefas do CRM
  const combinedEvents = [
    ...(todayEvents || []).map((event: any) => ({
      id: event.id,
      title: event.summary,
      start: new Date(event.start.dateTime || event.start.date),
      type: 'calendar' as const,
      link: event.htmlLink,
    })),
    ...tasks
      .filter(t => t.task_type === 'meeting' || t.task_type === 'call')
      .map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.due_date),
        type: 'task' as const,
        taskType: task.task_type,
        contact: task.contacts?.name,
      })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Agenda do Dia
          <Badge variant="outline" className="ml-auto">
            {combinedEvents.length} eventos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingEvents ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : combinedEvents.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500/50" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Nenhum evento hoje</p>
              <p className="text-xs text-muted-foreground">
                Você está livre! 🎉
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {combinedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center min-w-[50px] text-center">
                    <div className="text-xs font-medium text-muted-foreground">
                      {format(event.start, "HH:mm", { locale: ptBR })}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {event.type === 'calendar' ? (
                        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium truncate">{event.title}</p>
                    </div>
                    
                    {event.type === 'task' && event.contact && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Com: {event.contact}
                      </p>
                    )}

                    {event.type === 'calendar' && event.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 mt-1 text-xs"
                        onClick={() => window.open(event.link, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir no Calendar
                      </Button>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      event.type === 'calendar'
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    }
                  >
                    {event.type === 'calendar' ? 'Calendar' : 'Tarefa'}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {connectionStatus?.connected && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => window.open('https://calendar.google.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};