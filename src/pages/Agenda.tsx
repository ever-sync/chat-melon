import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/MainLayout';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { CreateEventModal } from '@/components/agenda/CreateEventModal';

type CalendarEvent = {
  id: string;
  type: 'google' | 'task' | 'deal';
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  description?: string;
  color: string;
  value?: number;
  assignedTo?: {
    name: string;
    avatar?: string;
  };
  metadata?: any;
};

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { connectionStatus, todayEvents, isLoadingEvents } = useGoogleCalendar();

  // Buscar tarefas do usuário
  const { data: tasks = [] } = useQuery({
    queryKey: ['user-tasks', currentDate],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const { data } = await supabase
        .from('tasks')
        .select('*, profiles(full_name, avatar_url)')
        .eq('assigned_to', user.id)
        .gte('due_date', start.toISOString())
        .lte('due_date', end.toISOString());

      return data || [];
    },
  });

  // Buscar deals do usuário
  const { data: deals = [] } = useQuery({
    queryKey: ['user-deals', currentDate],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const { data } = await supabase
        .from('deals')
        .select('*, contacts(name), pipeline_stages(name, color), profiles(full_name, avatar_url)')
        .eq('assigned_to', user.id)
        .gte('expected_close_date', start.toISOString())
        .lte('expected_close_date', end.toISOString());

      return data || [];
    },
  });

  // Consolidar todos os eventos
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Eventos do Google Calendar
    if (todayEvents && Array.isArray(todayEvents)) {
      todayEvents.forEach((event: any) => {
        if (event.start?.dateTime || event.start?.date) {
          events.push({
            id: event.id,
            type: 'google',
            title: event.summary || 'Sem título',
            date: parseISO(event.start.dateTime || event.start.date),
            startTime: event.start.dateTime ? format(parseISO(event.start.dateTime), 'HH:mm') : undefined,
            endTime: event.end?.dateTime ? format(parseISO(event.end.dateTime), 'HH:mm') : undefined,
            description: event.description,
            color: '#4285F4', // Azul Google
            metadata: event,
          });
        }
      });
    }

    // Tarefas
    tasks.forEach((task: any) => {
      if (task.due_date) {
        events.push({
          id: task.id,
          type: 'task',
          title: task.title,
          date: parseISO(task.due_date),
          description: task.description,
          color: task.priority === 'urgent' ? '#EF4444' : task.priority === 'high' ? '#F59E0B' : '#10B981',
          assignedTo: task.profiles
            ? {
                name: task.profiles.full_name,
                avatar: task.profiles.avatar_url,
              }
            : undefined,
          metadata: task,
        });
      }
    });

    // Deals
    deals.forEach((deal: any) => {
      if (deal.expected_close_date) {
        events.push({
          id: deal.id,
          type: 'deal',
          title: deal.title,
          date: parseISO(deal.expected_close_date),
          description: deal.contacts?.name,
          color: deal.pipeline_stages?.color || '#6B7280',
          value: deal.value,
          assignedTo: deal.profiles
            ? {
                name: deal.profiles.full_name,
                avatar: deal.profiles.avatar_url,
              }
            : undefined,
          metadata: deal,
        });
      }
    });

    return events;
  }, [todayEvents, tasks, deals]);

  // Agrupar eventos por data
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    allEvents.forEach((event) => {
      const dateKey = format(event.date, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(event);
    });
    return map;
  }, [allEvents]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  // Padding days para alinhar grid
  const startDay = startOfMonth(currentDate).getDay();
  const paddingDays = Array.from({ length: startDay });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'google':
        return '📅';
      case 'task':
        return '✓';
      case 'deal':
        return '💼';
      default:
        return '•';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm">
                <CalendarIcon className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Minha Agenda
                </h1>
                <p className="text-gray-500 mt-1 text-base">
                  Gerencie seus eventos, tarefas e negociações em um só lugar
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleCreateEvent(new Date())}
            className="h-11 rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Evento
          </Button>
        </div>

        {/* Google Calendar Status */}
        {!connectionStatus?.connected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Conecte seu Google Calendar nas{' '}
              <Link to="/settings" className="underline font-medium">
                configurações
              </Link>{' '}
              para sincronizar seus eventos automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Calendar */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 rounded-lg border shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold capitalize text-gray-900 dark:text-gray-100">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-medium"
                  onClick={handleToday}
                >
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Google Calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Tarefas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Negociações</span>
              </div>
            </div>
          </div>

          {/* Days Grid Header */}
          <div className="grid grid-cols-7 border-b bg-gray-50/50 dark:bg-gray-900/50">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px border-b overflow-auto">
            {paddingDays.map((_, i) => (
              <div key={`padding-${i}`} className="bg-white dark:bg-gray-950/30 min-h-[120px]" />
            ))}

            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate.get(dateKey) || [];
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'bg-white dark:bg-gray-950 min-h-[120px] p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50/80 relative group',
                    isTodayDate && 'bg-blue-50/30 ring-1 ring-inset ring-blue-500/20'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
                        isTodayDate ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCreateEvent(day)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Events List */}
                  <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1.5 rounded border-l-2 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        style={{ borderLeftColor: event.color }}
                      >
                        <div className="flex items-start gap-1">
                          <span className="text-[10px]">{getEventIcon(event.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-gray-900">{event.title}</div>
                            {event.startTime && (
                              <div className="text-[10px] text-muted-foreground">
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </div>
                            )}
                            {event.value && (
                              <div className="text-[10px] text-green-600 font-medium">
                                {formatCurrency(event.value)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center py-1">
                        +{dayEvents.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        selectedDate={selectedDate}
      />
    </MainLayout>
  );
}
