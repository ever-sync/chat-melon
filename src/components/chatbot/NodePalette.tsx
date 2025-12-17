import { memo } from 'react';
import { NODE_TYPE_INFO, type ChatbotNodeType } from '@/types/chatbot';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: ChatbotNodeType) => void;
}

const categories = {
  flow: { label: 'Fluxo', icon: 'GitBranch' },
  interaction: { label: 'Interação', icon: 'MessageSquare' },
  logic: { label: 'Lógica', icon: 'Settings' },
  action: { label: 'Ações', icon: 'Zap' },
  integration: { label: 'Integrações', icon: 'Globe' },
};

export const NodePalette = memo(function NodePalette({ onDragStart }: NodePaletteProps) {
  const nodesByCategory = Object.entries(NODE_TYPE_INFO).reduce(
    (acc, [type, info]) => {
      if (!acc[info.category]) {
        acc[info.category] = [];
      }
      acc[info.category].push({ type: type as ChatbotNodeType, ...info });
      return acc;
    },
    {} as Record<string, ((typeof NODE_TYPE_INFO)[ChatbotNodeType] & { type: ChatbotNodeType })[]>
  );

  return (
    <div className="w-64 border-r bg-muted/30 p-4">
      <h3 className="mb-4 text-sm font-semibold">Componentes</h3>

      <div className="space-y-4">
        {Object.entries(categories).map(([categoryKey, category]) => {
          const nodes = nodesByCategory[categoryKey];
          if (!nodes || nodes.length === 0) return null;

          const CategoryIcon = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{
            className?: string;
          }>;

          return (
            <div key={categoryKey}>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                <span>{category.label}</span>
              </div>

              <div className="space-y-1">
                {nodes.map((node) => {
                  const NodeIcon = Icons[node.icon as keyof typeof Icons] as React.ComponentType<{
                    className?: string;
                  }>;

                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      className={cn(
                        'flex cursor-grab items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-all',
                        'hover:border-primary hover:shadow-sm active:cursor-grabbing'
                      )}
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded"
                        style={{ backgroundColor: `${node.color}20` }}
                      >
                        {NodeIcon && <NodeIcon className="h-4 w-4" style={{ color: node.color }} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{node.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
