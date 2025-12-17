import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, X } from 'lucide-react';

interface DealWinLossModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'won' | 'lost';
  onSubmit: (data: { reason: string; detail: string }) => void;
}

export const DealWinLossModal = ({ open, onOpenChange, type, onSubmit }: DealWinLossModalProps) => {
  const { register, handleSubmit, setValue, watch, reset } = useForm<{
    reason: string;
    detail: string;
  }>();

  useEffect(() => {
    if (open && type === 'won') {
      // Trigger confetti when won modal opens
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          particleCount,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open, type]);

  const handleFormSubmit = (data: { reason: string; detail: string }) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  const wonReasons = [
    { value: 'price', label: 'Preço competitivo' },
    { value: 'relationship', label: 'Relacionamento / Confiança' },
    { value: 'product', label: 'Qualidade do produto' },
    { value: 'service', label: 'Qualidade do atendimento' },
    { value: 'other', label: 'Outro' },
  ];

  const lostReasons = [
    { value: 'price', label: 'Preço' },
    { value: 'competitor', label: 'Concorrente' },
    { value: 'timing', label: 'Timing / Momento errado' },
    { value: 'budget_cancelled', label: 'Orçamento cancelado' },
    { value: 'no_response', label: 'Cliente sem resposta' },
    { value: 'other', label: 'Outro' },
  ];

  const reasons = type === 'won' ? wonReasons : lostReasons;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'won' ? (
              <>
                <Trophy className="h-5 w-5 text-green-500" />
                🎉 Negócio Ganho!
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-destructive" />
                Negócio Perdido
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              {type === 'won' ? 'Motivo da Vitória' : 'Motivo da Perda'} *
            </Label>
            <Select
              value={watch('reason') || ''}
              onValueChange={(value) => setValue('reason', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail">Detalhes *</Label>
            <Textarea
              id="detail"
              {...register('detail', { required: true })}
              placeholder={
                type === 'won'
                  ? 'Descreva o que foi decisivo para ganhar este negócio...'
                  : 'Descreva o que levou à perda deste negócio...'
              }
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant={type === 'won' ? 'default' : 'destructive'}>
              {type === 'won' ? 'Registrar Vitória' : 'Registrar Perda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
