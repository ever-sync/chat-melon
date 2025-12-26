import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { CalendarIcon, Clock, Trash2, ExternalLink, Video, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

export const EventDetailModal = ({ open, onOpenChange, event }: EventDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState<Date | undefined>(event?.date);
  const [startTime, setStartTime] = useState(event?.startTime || '09:00');
  const [endTime, setEndTime] = useState(event?.endTime || '10:00');
  const [priority, setPriority] = useState(event?.metadata?.priority || 'medium');
  const [createMeet, setCreateMeet] = useState(false);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState('');

  const queryClient = useQueryClient();
  const { deleteCalendarEvent, updateGoogleEvent, deleteGoogleEvent } = useGoogleCalendar();

  // Reset form when event changes
  useState(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(event.date);
      setStartTime(event.startTime || '09:00');
      setEndTime(event.endTime || '10:00');
      setPriority(event.metadata?.priority || 'medium');
      setCreateMeet(!!event.metadata?.conferenceData?.entryPoints?.length);
      setAttendees(event.metadata?.attendees?.map((a: any) => a.email) || []);
      setAttendeeInput('');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!event || event.type !== 'task') return;

      const dueDateTime = new Date(date!);
      const [hours, minutes] = startTime.split(':');
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          due_date: dueDateTime.toISOString(),
          priority,
        })
        .eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      setIsEditing(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async () => {
      if (!event || event.type !== 'deal') return;

      const { error } = await supabase
        .from('deals')
        .update({
          title,
          expected_close_date: date?.toISOString(),
        })
        .eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Negociação atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-deals'] });
      setIsEditing(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar negociação: ' + error.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!event || event.type !== 'task') return;

      const { error } = await supabase.from('tasks').delete().eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarefa excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir tarefa: ' + error.message);
    },
  });

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

  const handleSave = () => {
    if (!event || !date) return;

    console.log('=== handleSave called ===');
    console.log('Event type:', event.type);
    console.log('Title:', title);
    console.log('Date:', date);
    console.log('Start time:', startTime);
    console.log('End time:', endTime);

    // Validações
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    // Validar que a data não é no passado (apenas para novos eventos ou quando a data foi alterada)
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

    console.log('Validations passed, saving...');

    if (event.type === 'task') {
      console.log('Updating task...');
      updateTaskMutation.mutate();
    } else if (event.type === 'deal') {
      console.log('Updating deal...');
      updateDealMutation.mutate();
    } else if (event.type === 'google') {
      console.log('Updating Google Calendar event...');

      // Atualiza evento do Google Calendar
      const startDateTime = new Date(date);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

      const endDateTime = new Date(date);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

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
      if (createMeet && !event.metadata?.conferenceData?.entryPoints?.length) {
        console.log('Adding Google Meet to event...');
        eventData.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }

      console.log('Event data to update:', eventData);
      console.log('Event ID:', event.id);

      updateGoogleEvent.mutate({
        eventId: event.id,
        event: eventData,
      }, {
        onSuccess: () => {
          console.log('Update successful!');
          setIsEditing(false);
          onOpenChange(false);
        },
        onError: (error) => {
          console.error('Update failed:', error);
        },
      });
    }
  };

  const handleDelete = () => {
    if (!event) return;

    if (event.type === 'task') {
      deleteTaskMutation.mutate();
    } else if (event.type === 'google') {
      deleteGoogleEvent.mutate({ eventId: event.id }, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    } else {
      toast.info('Este tipo de evento não pode ser excluído pela agenda');
    }
    setShowDeleteDialog(false);
  };

  const getEventTypeLabel = () => {
    switch (event?.type) {
      case 'google':
        return 'Evento do Google Calendar';
      case 'task':
        return 'Tarefa';
      case 'deal':
        return 'Negociação';
      default:
        return 'Evento';
    }
  };

  const canEdit = event?.type === 'task' || event?.type === 'deal' || event?.type === 'google';
  const canDelete = event?.type === 'task' || event?.type === 'google';

  if (!event) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{isEditing ? 'Editar Evento' : 'Detalhes do Evento'}</DialogTitle>
                <DialogDescription>{getEventTypeLabel()}</DialogDescription>
              </div>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: event.color }}
              />
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Título */}
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{event.title}</h2>
              </div>
            )}

            {/* Descrição */}
            {(event.description || isEditing) && (
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
              </div>
            )}

            {/* Data e Horário */}
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
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
                        {date ? format(date, 'PPP', { locale: ptBR }) : <span>Selecione</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>

                {event.startTime && (
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="flex-1"
                      />
                      <span className="self-center">-</span>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <CalendarIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">{format(event.date, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: ptBR })}</p>
                  {event.startTime && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.startTime} - {event.endTime || '...'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Google Meet - Modo Visualização */}
            {event.type === 'google' && event.metadata?.conferenceData?.entryPoints?.length > 0 && !isEditing && (
              <div className="space-y-3 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Google Meet</span>
                </div>
                <a
                  href={event.metadata.conferenceData.entryPoints[0].uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Video className="h-4 w-4" />
                  Entrar com o Google Meet
                </a>
                <p className="text-xs text-blue-700 dark:text-blue-300 break-all">
                  {event.metadata.conferenceData.entryPoints[0].uri}
                </p>
              </div>
            )}

            {/* Google Meet - Modo Edição (apenas se não tiver Meet já criado) */}
            {event.type === 'google' && isEditing && !event.metadata?.conferenceData?.entryPoints?.length && (
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
                  Adicionar link do Google Meet
                </label>
              </div>
            )}

            {/* Participantes - Modo Visualização */}
            {event.type === 'google' && event.metadata?.attendees?.length > 0 && !isEditing && (
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Participantes ({event.metadata.attendees.length})</Label>
                <div className="space-y-2">
                  {event.metadata.attendees.map((attendee: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                        {attendee.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-gray-100">{attendee.email}</p>
                        {attendee.responseStatus && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {attendee.responseStatus === 'accepted' && 'Aceitou'}
                            {attendee.responseStatus === 'declined' && 'Recusou'}
                            {attendee.responseStatus === 'tentative' && 'Talvez'}
                            {attendee.responseStatus === 'needsAction' && 'Sem resposta'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participantes - Modo Edição */}
            {event.type === 'google' && isEditing && (
              <div className="space-y-2">
                <Label htmlFor="attendees">Participantes</Label>
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

            {/* Prioridade (só para tarefas) */}
            {event.type === 'task' && (
              <div className="space-y-2">
                <Label>Prioridade</Label>
                {isEditing ? (
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
                ) : (
                  <p className="text-sm capitalize">{event.metadata?.priority || 'Média'}</p>
                )}
              </div>
            )}

            {/* Valor (só para deals) */}
            {event.type === 'deal' && event.value && (
              <div className="space-y-2">
                <Label>Valor</Label>
                <p className="text-sm font-semibold text-green-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(event.value)}
                </p>
              </div>
            )}

            {/* Link para Google Calendar */}
            {event.type === 'google' && event.metadata?.htmlLink && (
              <div className="pt-2">
                <a
                  href={event.metadata.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir no Google Calendar
                </a>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {canDelete && !isEditing && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}

            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={updateTaskMutation.isPending || updateDealMutation.isPending || updateGoogleEvent.isPending}>
                  {updateTaskMutation.isPending || updateDealMutation.isPending || updateGoogleEvent.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                {canEdit && (
                  <Button onClick={() => setIsEditing(true)}>Editar</Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{event.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
