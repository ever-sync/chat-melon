import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StagesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order_index: number;
  probability_default: number;
  is_closed_won: boolean;
  is_closed_lost: boolean;
}

function SortableStage({
  stage,
  onUpdate,
  onDelete,
}: {
  stage: Stage;
  onUpdate: (id: string, data: Partial<Stage>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-4 relative transition-all",
        isDragging && "scale-105 rotate-1"
      )}
    >
      <Card className={cn(
        "border-none shadow-sm overflow-hidden bg-white rounded-2xl ring-1 ring-gray-100 transition-all",
        isDragging ? "shadow-2xl ring-indigo-500/50" : "hover:shadow-md"
      )}>
        <CardContent className="p-0">
          <div className="flex items-stretch min-h-[100px]">
            {/* Drag Handle Area */}
            <div
              {...attributes}
              {...listeners}
              className="w-12 bg-gray-50 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-indigo-50 transition-colors group"
            >
              <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nome da Etapa</Label>
                <Input
                  value={stage.name}
                  onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
                  placeholder="Ex: Qualificação Estratégica"
                  className="rounded-xl h-11 border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cor</Label>
                <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl px-3 h-11 border border-gray-100">
                  <input
                    type="color"
                    value={stage.color}
                    onChange={(e) => onUpdate(stage.id, { color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-sm font-mono text-gray-400 uppercase">{stage.color}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Fechamento (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={stage.probability_default}
                    onChange={(e) =>
                      onUpdate(stage.id, { probability_default: parseInt(e.target.value) })
                    }
                    className="rounded-xl h-11 border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold text-indigo-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="p-4 flex items-center bg-gray-50/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(stage.id)}
                className="rounded-xl h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StagesManager({ open, onOpenChange, pipelineId }: StagesManagerProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (pipelineId && open) {
      loadStages();
    }
  }, [pipelineId, open]);

  const loadStages = async () => {
    if (!pipelineId) return;

    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error loading stages:', error);
      toast.error('Erro ao carregar etapas');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUpdateStage = (id: string, data: Partial<Stage>) => {
    setStages((prev) => prev.map((stage) => (stage.id === id ? { ...stage, ...data } : stage)));
  };

  const handleAddStage = () => {
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      name: 'Nova Etapa',
      color: '#6366f1',
      order_index: stages.length,
      probability_default: 50,
      is_closed_won: false,
      is_closed_lost: false,
    };
    setStages([...stages, newStage]);
  };

  const handleDeleteStage = (id: string) => {
    setStages((prev) => prev.filter((stage) => stage.id !== id));
  };

  const handleSave = async () => {
    if (!pipelineId) return;

    setLoading(true);
    try {
      // Delete all existing stages
      const { error: deleteError } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('pipeline_id', pipelineId);

      if (deleteError) throw deleteError;

      // Insert updated stages
      const stagesToInsert = stages.map((stage, index) => ({
        pipeline_id: pipelineId,
        name: stage.name,
        color: stage.color,
        order_index: index,
        probability_default: stage.probability_default,
        is_closed_won: stage.is_closed_won,
        is_closed_lost: stage.is_closed_lost,
      }));

      const { error: insertError } = await supabase.from('pipeline_stages').insert(stagesToInsert);

      if (insertError) throw insertError;

      toast.success('Etapas atualizadas com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving stages:', error);
      toast.error('Erro ao salvar etapas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Settings2 className="w-32 h-32" />
          </div>
          <DialogTitle className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings2 className="h-8 w-8" />
            Configurar Etapas
          </DialogTitle>
          <DialogDescription className="text-indigo-100 text-lg">
            Defina o fluxo de trabalho e as probabilidades de fechamento para cada etapa.
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6 bg-gray-50/50">
          <div className="max-h-[50vh] overflow-y-auto pr-4 -mr-4 custom-scrollbar">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {stages.map((stage) => (
                  <SortableStage
                    key={stage.id}
                    stage={stage}
                    onUpdate={handleUpdateStage}
                    onDelete={handleDeleteStage}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <Button
            variant="ghost"
            onClick={handleAddStage}
            className="w-full h-14 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-white rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-indigo-600 font-bold transition-all"
          >
            <Plus className="h-5 w-5" />
            Adicionar Nova Etapa de Vendas
          </Button>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-12 px-8 font-bold text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="rounded-2xl h-12 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/20 font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Salvando...' : 'Salvar Fluxo de Etapas'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
