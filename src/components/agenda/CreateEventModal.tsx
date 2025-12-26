import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
}

type EventType = 'google' | 'task';

export const CreateEventModal = ({ open, onOpenChange, selectedDate }: CreateEventModalProps) => {
  const [eventType, setEventType] = useState<EventType>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState('medium');

  const { connectionStatus, createCalendarEvent } = useGoogleCalendar();
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile) throw new Error('Profile not found');

      const dueDateTime = new Date(date!);
      const [hours, minutes] = startTime.split(':');
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data, error } = await supabase.from('tasks').insert({
        title,
        description,
        due_date: dueDateTime.toISOString(),
        assigned_to: user.id,
        company_id: profile.company_id,
        priority,
        status: 'pending',
        type: 'meeting',
      }).select().single();

      if (error) throw error;

      // Se conectado ao Google Calendar e é uma reunião, criar evento
      if (connectionStatus?.connected && eventType === 'google') {
        await createCalendarEvent.mutateAsync({
          taskId: data.id,
          companyId: profile.company_id,
        });
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Evento criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar evento: ' + error.message);
    },
  });

  const createGoogleEventMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
      if (!profile) throw new Error('Profile not found');

      const startDateTime = new Date(date!);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

      const endDateTime = new Date(date!);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create_direct_event',
          userId: user.id,
          companyId: profile.company_id,
          event: {
            summary: title,
            description,
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'America/Sao_Paulo',
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'America/Sao_Paulo',
            },
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Evento do Google Calendar criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar evento: ' + error.message);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(selectedDate || new Date());
    setStartTime('09:00');
    setEndTime('10:00');
    setPriority('medium');
    setEventType('task');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date) {
      toast.error('Preencha o título e a data');
      return;
    }

    if (eventType === 'google') {
      if (!connectionStatus?.connected) {
        toast.error('Conecte seu Google Calendar nas configurações primeiro');
        return;
      }
      createGoogleEventMutation.mutate();
    } else {
      createTaskMutation.mutate();
    }
  };

  const isLoading = createTaskMutation.isPending || createGoogleEventMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
          <DialogDescription>
            Adicione um novo evento à sua agenda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Evento */}
          <div className="space-y-2">
            <Label>Tipo de Evento</Label>
            <Select value={eventType} onValueChange={(value: EventType) => setEventType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Tarefa/Reunião (Sistema)</SelectItem>
                <SelectItem value="google" disabled={!connectionStatus?.connected}>
                  Google Calendar {!connectionStatus?.connected && '(Não conectado)'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Reunião com cliente"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes do evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Início</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Fim</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Prioridade (apenas para tarefas) */}
          {eventType === 'task' && (
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
