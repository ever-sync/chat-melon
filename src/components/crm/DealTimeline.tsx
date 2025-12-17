import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Target,
  ArrowRight,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  CheckSquare,
  MessageSquare,
  Phone,
  StickyNote,
  User,
  Plus,
  Filter,
  Mail,
  Eye,
} from 'lucide-react';
import { useDealActivities } from '@/hooks/useDealActivities';
import { DealActivityModal } from './DealActivityModal';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DealTimelineProps {
  dealId: string;
}

const activityIcons = {
  deal_created: Target,
  stage_change: ArrowRight,
  value_changed: DollarSign,
  proposal_sent: FileText,
  proposal_accepted: CheckCircle,
  proposal_rejected: XCircle,
  task_completed: CheckSquare,
  message_sent: MessageSquare,
  email_sent: Mail,
  call_made: Phone,
  note_added: StickyNote,
  assigned_changed: User,
  created: Target,
};

export const DealTimeline = ({ dealId }: DealTimelineProps) => {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { activities, isLoading } = useDealActivities(dealId);

  const getDateLabel = (date: string) => {
    const activityDate = new Date(date);
    if (isToday(activityDate)) return 'Hoje';
    if (isYesterday(activityDate)) return 'Ontem';
    return format(activityDate, "d 'de' MMMM", { locale: ptBR });
  };

  const groupedActivities = activities.reduce(
    (acc, activity) => {
      const dateLabel = getDateLabel(activity.created_at!);
      if (!acc[dateLabel]) {
        acc[dateLabel] = [];
      }
      acc[dateLabel].push(activity);
      return acc;
    },
    {} as Record<string, typeof activities>
  );

  const filteredGroups = Object.entries(groupedActivities).reduce(
    (acc, [date, items]) => {
      const filtered =
        typeFilter.length > 0
          ? items.filter((item) => typeFilter.includes(item.activity_type))
          : items;

      if (filtered.length > 0) {
        acc[date] = filtered;
      }
      return acc;
    },
    {} as Record<string, typeof activities>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando timeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Timeline do Negócio</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" onClick={() => setShowAddActivity(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Atividade
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
          {Object.keys(activityIcons).map((type) => (
            <Badge
              key={type}
              variant={typeFilter.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setTypeFilter((prev) =>
                  prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                );
              }}
            >
              {type.replace(/_/g, ' ')}
            </Badge>
          ))}
          {typeFilter.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setTypeFilter([])}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([date, items]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-muted-foreground">📅 {date}</div>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-4 pl-4 border-l-2 border-border">
                {items.map((activity) => {
                  const Icon =
                    activityIcons[activity.activity_type as keyof typeof activityIcons] ||
                    StickyNote;
                  const time = format(new Date(activity.created_at!), 'HH:mm');

                  return (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute left-0 top-0 -translate-x-1/2 translate-y-1 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{time}</span>
                          <span className="text-sm text-muted-foreground">
                            {activity.description}
                          </span>
                          {activity.activity_type === 'email_sent' &&
                            typeof activity.metadata === 'object' &&
                            activity.metadata &&
                            'opened_at' in activity.metadata &&
                            activity.metadata.opened_at && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Aberto
                              </Badge>
                            )}
                        </div>
                        {activity.metadata && typeof activity.metadata === 'object' && (
                          <div className="text-xs text-muted-foreground pl-16">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <div key={key}>
                                {key}: {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(filteredGroups).length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma atividade encontrada
            </div>
          )}
        </div>
      </ScrollArea>

      <DealActivityModal dealId={dealId} open={showAddActivity} onOpenChange={setShowAddActivity} />
    </div>
  );
};
