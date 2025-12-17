import { useDealActivities } from "@/hooks/crm/useDealActivities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DealActivityTimelineProps {
  dealId: string;
}

export const DealActivityTimeline = ({ dealId }: DealActivityTimelineProps) => {
  const {
    activities,
    groupedActivities,
    recentActivities,
    isLoading,
    getActivityIcon,
    getActivityColor,
    formatActivityDescription,
  } = useDealActivities(dealId);

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityBgColor = (type: string): string => {
    const colors: Record<string, string> = {
      created: "bg-green-100 dark:bg-green-900",
      updated: "bg-blue-100 dark:bg-blue-900",
      stage_change: "bg-purple-100 dark:bg-purple-900",
      note_added: "bg-yellow-100 dark:bg-yellow-900",
      task_created: "bg-orange-100 dark:bg-orange-900",
      task_completed: "bg-green-100 dark:bg-green-900",
      file_uploaded: "bg-blue-100 dark:bg-blue-900",
      contact_linked: "bg-indigo-100 dark:bg-indigo-900",
      email_sent: "bg-cyan-100 dark:bg-cyan-900",
      call_made: "bg-pink-100 dark:bg-pink-900",
      meeting_scheduled: "bg-teal-100 dark:bg-teal-900",
      custom: "bg-gray-100 dark:bg-gray-900",
    };
    return colors[type] || "bg-gray-100 dark:bg-gray-900";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">📝</span>
        </div>
        <p className="text-sm font-medium">Nenhuma atividade registrada</p>
        <p className="text-xs mt-1">
          As atividades aparecerão aqui conforme você interage com o negócio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Badge de atividades recentes */}
      {recentActivities.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            ⚡ {recentActivities.length} atividade(s) nas últimas 24 horas
          </Badge>
        </div>
      )}

      {/* Timeline agrupada por data */}
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <div key={date} className="space-y-3">
          {/* Cabeçalho da data */}
          <div className="flex items-center gap-2">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs font-semibold text-muted-foreground px-2">
              {date}
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Atividades da data */}
          <div className="relative space-y-3 pl-8">
            {/* Linha vertical */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

            {dateActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Ícone da atividade */}
                <div
                  className={cn(
                    "absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10",
                    getActivityBgColor(activity.activity_type)
                  )}
                >
                  <span>{getActivityIcon(activity.activity_type)}</span>
                </div>

                {/* Conteúdo da atividade */}
                <div className="bg-card border rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          getActivityColor(activity.activity_type)
                        )}
                      >
                        {formatActivityDescription(activity)}
                      </p>

                      {/* Metadados expandidos (se existirem) */}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hora */}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(activity.created_at), "HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  {/* Autor da atividade */}
                  {activity.profile && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={activity.profile.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(activity.profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {activity.profile.full_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Indicador de fim da timeline */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span>Início do negócio</span>
        </div>
      </div>
    </div>
  );
};
