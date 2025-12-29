import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmailBlock, EmailGlobalStyles } from './types';
import { BlockRenderer } from './BlockRenderer';

interface SortableBlockProps {
  block: EmailBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  globalStyles: EmailGlobalStyles;
}

export function SortableBlock({
  block,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  globalStyles,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'opacity-50 z-50',
        isSelected && 'ring-2 ring-indigo-500 ring-offset-2'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Block Controls */}
      <div
        className={cn(
          'absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 bg-white rounded-md shadow-md border border-gray-200 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Block Actions */}
      <div
        className={cn(
          'absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white shadow-md text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Block Highlight Border */}
      <div
        className={cn(
          'absolute inset-0 border-2 border-transparent pointer-events-none transition-colors',
          'group-hover:border-indigo-300',
          isSelected && 'border-indigo-500'
        )}
      />

      {/* Block Content */}
      <BlockRenderer block={block} globalStyles={globalStyles} />
    </div>
  );
}
