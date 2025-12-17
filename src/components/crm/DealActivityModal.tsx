import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useDealActivities } from '@/hooks/useDealActivities';

interface DealActivityModalProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActivityForm {
  activity_type: string;
  description: string;
  datetime: string;
  result?: string;
}

export const DealActivityModal = ({ dealId, open, onOpenChange }: DealActivityModalProps) => {
  const { register, handleSubmit, watch, setValue, reset } = useForm<ActivityForm>({
    defaultValues: {
      datetime: new Date().toISOString().slice(0, 16),
    },
  });
  const { addActivity } = useDealActivities(dealId);

  const activityType = watch('activity_type');

  const onSubmit = (data: ActivityForm) => {
    const metadata: Record<string, any> = {
      datetime: data.datetime,
    };

    if (data.result) {
      metadata.result = data.result;
    }

    addActivity.mutate({
      deal_id: dealId,
      activity_type: data.activity_type,
      description: data.description,
      metadata,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Atividade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity_type">Tipo de Atividade *</Label>
            <Select
              value={watch('activity_type')}
              onValueChange={(value) => setValue('activity_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call_made">📞 Ligação</SelectItem>
                <SelectItem value="meeting">🤝 Reunião</SelectItem>
                <SelectItem value="email_sent">📧 Email</SelectItem>
                <SelectItem value="note_added">📝 Nota</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">Data e Hora *</Label>
            <Input
              id="datetime"
              type="datetime-local"
              {...register('datetime', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              {...register('description', { required: true })}
              placeholder="Descreva a atividade..."
              rows={3}
            />
          </div>

          {(activityType === 'call_made' || activityType === 'meeting') && (
            <div className="space-y-2">
              <Label htmlFor="result">Resultado</Label>
              <Select value={watch('result')} onValueChange={(value) => setValue('result', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">✅ Sucesso</SelectItem>
                  <SelectItem value="no_answer">📵 Não atendeu</SelectItem>
                  <SelectItem value="callback">🔄 Retornar mais tarde</SelectItem>
                  <SelectItem value="not_interested">❌ Não interessado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
