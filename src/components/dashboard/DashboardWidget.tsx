import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isDragging?: boolean;
  onRemove?: () => void;
  isCustomizing?: boolean;
  className?: string;
}

export function DashboardWidget({
  id,
  title,
  children,
  isDragging,
  onRemove,
  isCustomizing,
  className,
}: DashboardWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    disabled: !isCustomizing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-0 shadow-sm rounded-[24px] bg-white overflow-hidden transition-all duration-200',
        isDragging && 'opacity-50 ring-2 ring-indigo-500 scale-105',
        isCustomizing && 'ring-2 ring-indigo-200 hover:ring-indigo-300 hover:shadow-lg',
        className
      )}
    >
      {isCustomizing && (
        <div
          {...attributes}
          {...listeners}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 flex items-center justify-between border-b border-indigo-100 cursor-move"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Arraste para mover</span>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <X className="h-4 w-4 text-indigo-600" />
            </button>
          )}
        </div>
      )}
      <div className="relative">{children}</div>
    </Card>
  );
}
