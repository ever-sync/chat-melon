import { useState, useEffect } from 'react';
import { useQueues } from '@/hooks/useQueues';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QueueModalProps {
  open: boolean;
  onClose: () => void;
  queue?: any;
}

const COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
];

const DAYS = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export const QueueModal = ({ open, onClose, queue }: QueueModalProps) => {
  const { createQueue, updateQueue } = useQueues();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    color: string;
    max_conversations_per_agent: number;
    auto_assign: boolean;
    assignment_method: string;
    is_active: boolean;
    working_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  }>({
    name: '',
    description: '',
    color: '#3B82F6',
    max_conversations_per_agent: 5,
    auto_assign: true,
    assignment_method: 'round_robin',
    is_active: true,
    working_hours: DAYS.reduce(
      (acc, day) => ({
        ...acc,
        [day.key]: { enabled: true, start: '08:00', end: '18:00' },
      }),
      {} as Record<string, { enabled: boolean; start: string; end: string }>
    ),
  });

  useEffect(() => {
    if (queue) {
      setFormData({
        name: queue.name,
        description: queue.description || '',
        color: queue.color,
        max_conversations_per_agent: queue.max_conversations_per_agent,
        auto_assign: queue.auto_assign,
        assignment_method: queue.assignment_method,
        is_active: queue.is_active,
        working_hours: queue.working_hours,
      });
    }
  }, [queue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (queue) {
        await updateQueue({ id: queue.id, ...formData });
      } else {
        await createQueue(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      working_hours: {
        ...formData.working_hours,
        [day]: {
          ...formData.working_hours[day],
          [field]: value,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{queue ? 'Editar Fila' : 'Nova Fila'}</DialogTitle>
          <DialogDescription>
            Configure as propriedades e horários de funcionamento da fila
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="schedule">Horários</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Fila *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Suporte, Vendas, Financeiro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o propósito desta fila"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_conversations">Máximo de Conversas por Agente</Label>
                <Input
                  id="max_conversations"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.max_conversations_per_agent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_conversations_per_agent: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment_method">Método de Distribuição</Label>
                <Select
                  value={formData.assignment_method}
                  onValueChange={(value) => setFormData({ ...formData, assignment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">Rodízio (Round Robin)</SelectItem>
                    <SelectItem value="least_busy">Menos Ocupado</SelectItem>
                    <SelectItem value="random">Aleatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto_assign">Auto-atribuir conversas</Label>
                <Switch
                  id="auto_assign"
                  checked={formData.auto_assign}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_assign: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Fila ativa</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Configure os horários de funcionamento da fila
              </p>

              {DAYS.map((day) => {
                const hours = formData.working_hours[day.key];
                return (
                  <div key={day.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{day.label}</Label>
                      <Switch
                        checked={hours.enabled}
                        onCheckedChange={(checked) =>
                          handleWorkingHoursChange(day.key, 'enabled', checked)
                        }
                      />
                    </div>
                    {hours.enabled && (
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        <div>
                          <Label className="text-xs">Início</Label>
                          <Input
                            type="time"
                            value={hours.start}
                            onChange={(e) =>
                              handleWorkingHoursChange(day.key, 'start', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fim</Label>
                          <Input
                            type="time"
                            value={hours.end}
                            onChange={(e) =>
                              handleWorkingHoursChange(day.key, 'end', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : queue ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
