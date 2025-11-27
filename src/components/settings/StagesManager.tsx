import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function SortableStage({ stage, onUpdate, onDelete }: { stage: Stage; onUpdate: (id: string, data: Partial<Stage>) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={stage.name}
                onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
                placeholder="Nome da etapa"
              />
            </div>

            <div>
              <Label className="text-xs">Cor</Label>
              <Input
                type="color"
                value={stage.color}
                onChange={(e) => onUpdate(stage.id, { color: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs">Probabilidade (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={stage.probability_default}
                onChange={(e) => onUpdate(stage.id, { probability_default: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(stage.id)}
            className="mt-6"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
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
        .from("pipeline_stages")
        .select("*")
        .eq("pipeline_id", pipelineId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error("Error loading stages:", error);
      toast.error("Erro ao carregar etapas");
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
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === id ? { ...stage, ...data } : stage
      )
    );
  };

  const handleAddStage = () => {
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      name: "Nova Etapa",
      color: "#3B82F6",
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
        .from("pipeline_stages")
        .delete()
        .eq("pipeline_id", pipelineId);

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

      const { error: insertError } = await supabase
        .from("pipeline_stages")
        .insert(stagesToInsert);

      if (insertError) throw insertError;

      toast.success("Etapas atualizadas com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving stages:", error);
      toast.error("Erro ao salvar etapas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Etapas</DialogTitle>
          <DialogDescription>
            Arraste para reordenar as etapas do pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
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

          <Button
            variant="outline"
            onClick={handleAddStage}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etapa
          </Button>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
