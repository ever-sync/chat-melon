import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, GripVertical, Edit, Power } from 'lucide-react';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldModal } from './CustomFieldModal';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CustomField } from '@/hooks/useCustomFields';

type EntityType = 'contact' | 'deal' | 'company';

const fieldTypeLabels: Record<string, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Data',
  select: 'Seleção',
  multiselect: 'Múltipla Escolha',
  boolean: 'Sim/Não',
  url: 'URL',
  email: 'Email',
  phone: 'Telefone',
  currency: 'Moeda',
};

function SortableFieldItem({
  field,
  onEdit,
  onToggle,
}: {
  field: CustomField;
  onEdit: (field: CustomField) => void;
  onToggle: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-accent/50"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{field.field_label}</h4>
          {field.is_required && <span className="text-xs text-destructive">*</span>}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{fieldTypeLabels[field.field_type]}</span>
          <span>•</span>
          <code className="text-xs">{field.field_name}</code>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(field)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onToggle(field.id)}>
          <Power className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CustomFieldsManager() {
  const [entityType, setEntityType] = useState<EntityType>('contact');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | undefined>();

  const { fields, reorderFields, deleteField } = useCustomFields(entityType);
  const [items, setItems] = useState(fields);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update items when fields change
  useEffect(() => {
    setItems(fields);
  }, [fields]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update display_order in database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));
      reorderFields.mutate(updates);
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  const handleToggle = (id: string) => {
    deleteField.mutate(id);
  };

  const handleCreate = () => {
    setEditingField(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campos Customizados</h2>
          <p className="text-muted-foreground">
            Adicione campos personalizados para coletar informações específicas
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Campo
        </Button>
      </div>

      <Tabs value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
        <TabsList>
          <TabsTrigger value="contact">Contatos</TabsTrigger>
          <TabsTrigger value="deal">Negócios</TabsTrigger>
          <TabsTrigger value="company">Empresas</TabsTrigger>
        </TabsList>

        <TabsContent value={entityType} className="space-y-4 mt-4">
          {items.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum campo customizado criado ainda.</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Campo
              </Button>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((field) => (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      onEdit={handleEdit}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>
      </Tabs>

      <CustomFieldModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        entityType={entityType}
        field={editingField}
      />
    </div>
  );
}
