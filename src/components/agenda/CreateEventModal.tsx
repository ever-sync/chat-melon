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
import { Checkbox } from '@/components/ui/checkbox';
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
import { CalendarIcon, Clock, Video, Mail, X } from 'lucide-react';
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
  const [createMeet, setCreateMeet] = useState(false);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState('');

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
      console.log('Creating Google Calendar event...');

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

      console.log('Invoking google-calendar-sync function...', {
        action: 'create_direct_event',
        userId: user.id,
        title,
        createMeet,
      });

      // Monta lista de participantes
      const attendeesList = attendees.map(email => ({ email }));

      const eventData: any = {
        summary: title,
        description: description || undefined,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        attendees: attendeesList.length > 0 ? attendeesList : undefined,
      };

      // Se deve criar Google Meet, adiciona a configuração de conferência
      if (createMeet) {
        eventData.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create_direct_event',
          userId: user.id,
          companyId: profile.company_id,
          event: eventData,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Error from function:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      if (data?.meetLink) {
        toast.success(
          `Evento criado com sucesso! Link do Meet: ${data.meetLink}`,
          { duration: 5000 }
        );
      } else {
        toast.success('Evento do Google Calendar criado com sucesso!');
      }
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
    setCreateMeet(false);
    setAttendees([]);
    setAttendeeInput('');
  };

  const addAttendee = () => {
    const email = attendeeInput.trim();
    if (email && !attendees.includes(email)) {
      // Valida email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        setAttendees([...attendees, email]);
        setAttendeeInput('');
      } else {
        toast.error('Email inválido');
      }
    }
  };

  const removeAttendee = (email: string) => {
    setAttendees(attendees.filter(a => a !== email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (!date) {
      toast.error('Selecione uma data');
      return;
    }

    // Validar que a data não é no passado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Não é possível agendar eventos em datas passadas');
      return;
    }

    // Validar horários
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startInMinutes = startHours * 60 + startMinutes;
      const endInMinutes = endHours * 60 + endMinutes;

      if (startInMinutes >= endInMinutes) {
        toast.error('O horário de término deve ser posterior ao horário de início');
        return;
      }
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

          {/* Criar Google Meet automaticamente (apenas para eventos do Google) */}
          {eventType === 'google' && (
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="createMeet"
                checked={createMeet}
                onCheckedChange={(checked) => setCreateMeet(checked as boolean)}
              />
              <label
                htmlFor="createMeet"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Video className="h-4 w-4 text-blue-600" />
                Criar link do Google Meet automaticamente
              </label>
            </div>
          )}

          {/* Participantes (apenas para eventos do Google) */}
          {eventType === 'google' && (
            <div className="space-y-2">
              <Label htmlFor="attendees">Participantes (opcional)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="attendees"
                    placeholder="Email do participante"
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAttendee();
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                <Button type="button" onClick={addAttendee} variant="outline">
                  Adicionar
                </Button>
              </div>
              {attendees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attendees.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeAttendee(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
