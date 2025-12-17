import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Clock, AlarmClock, CalendarIcon } from 'lucide-react';
import { useSnooze, SNOOZE_OPTIONS } from '@/hooks/chat/useSnooze';
import { format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SnoozeMenuProps {
  conversationId: string;
  trigger?: React.ReactNode;
}

export const SnoozeMenu = ({ conversationId, trigger }: SnoozeMenuProps) => {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState('09:00');

  const { snooze } = useSnooze();

  const handleSnooze = async (option: (typeof SNOOZE_OPTIONS)[0]) => {
    await snooze.mutateAsync({
      conversationId,
      until: option.getDate(),
    });
    setOpen(false);
  };

  const handleCustomSnooze = async () => {
    if (!customDate) return;

    const [hours, minutes] = customTime.split(':').map(Number);
    const until = setMinutes(setHours(customDate, hours), minutes);

    await snooze.mutateAsync({
      conversationId,
      until,
    });

    setShowCustom(false);
    setOpen(false);
    setCustomDate(undefined);
    setCustomTime('09:00');
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm" className="gap-2">
              <AlarmClock className="h-4 w-4" />
              Adiar
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="end">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-2 py-1">
              <Clock className="h-4 w-4" />
              Adiar conversa
            </div>
          </div>

          <div className="p-1">
            {SNOOZE_OPTIONS.map((option) => (
              <button
                key={option.id}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                onClick={() => handleSnooze(option)}
                disabled={snooze.isPending}
              >
                {option.label}
              </button>
            ))}

            <div className="border-t border-border my-1" />

            <button
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2"
              onClick={() => setShowCustom(true)}
            >
              <CalendarIcon className="h-4 w-4" />
              Data personalizada...
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adiar para data específica</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={customDate}
                onSelect={setCustomDate}
                locale={ptBR}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
            </div>

            {customDate && (
              <div className="text-sm text-muted-foreground text-center">
                A conversa reaparecerá em{' '}
                <strong>
                  {format(customDate, "dd 'de' MMMM", { locale: ptBR })} às {customTime}
                </strong>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustom(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCustomSnooze} disabled={!customDate || snooze.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
