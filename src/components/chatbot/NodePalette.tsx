import { memo, useState, useMemo } from 'react';
import { NODE_TYPE_INFO, NODE_CATEGORIES, type ChatbotNodeType, type NodeCategory } from '@/types/chatbot';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, Search, Crown, Sparkles } from 'lucide-react';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: ChatbotNodeType) => void;
}

// Order of categories to display
const categoryOrder: NodeCategory[] = [
  'flow',
  'interaction',
  'advanced_interaction',
  'logic',
  'action',
  'ai',
  'integration',
  'ecommerce',
  'multimedia',
];

export const NodePalette = memo(function NodePalette({ onDragStart }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['flow', 'interaction', 'logic'])
  );

  const nodesByCategory = useMemo(() => {
    return Object.entries(NODE_TYPE_INFO).reduce(
      (acc, [type, info]) => {
        if (!acc[info.category]) {
          acc[info.category] = [];
        }
        acc[info.category].push({ type: type as ChatbotNodeType, ...info });
        return acc;
      },
      {} as Record<string, ((typeof NODE_TYPE_INFO)[ChatbotNodeType] & { type: ChatbotNodeType })[]>
    );
  }, []);

  const filteredNodesByCategory = useMemo(() => {
    if (!searchQuery) return nodesByCategory;

    const query = searchQuery.toLowerCase();
    const filtered: typeof nodesByCategory = {};

    Object.entries(nodesByCategory).forEach(([category, nodes]) => {
      const matchingNodes = nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(query) ||
          node.description.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query)
      );
      if (matchingNodes.length > 0) {
        filtered[category] = matchingNodes;
      }
    });

    return filtered;
  }, [nodesByCategory, searchQuery]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const totalNodes = Object.values(NODE_TYPE_INFO).length;

  return (
    <div className="w-72 border-r bg-gradient-to-b from-background to-muted/20 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Componentes</h3>
          <Badge variant="secondary" className="text-[10px]">
            {totalNodes} blocos
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar componentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Node Categories */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {categoryOrder.map((categoryKey) => {
            const category = NODE_CATEGORIES[categoryKey];
            const nodes = filteredNodesByCategory[categoryKey];
            if (!nodes || nodes.length === 0) return null;

            const CategoryIcon = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>;
            const isExpanded = expandedCategories.has(categoryKey) || !!searchQuery;

            return (
              <Collapsible
                key={categoryKey}
                open={isExpanded}
                onOpenChange={() => !searchQuery && toggleCategory(categoryKey)}
              >
                <CollapsibleTrigger className="w-full">
                  <div
                    className={cn(
                      'flex items-center justify-between px-2 py-1.5 rounded-md transition-colors',
                      'hover:bg-muted/50 cursor-pointer'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {CategoryIcon && (
                          <CategoryIcon className="h-3 w-3" style={{ color: category.color }} />
                        )}
                      </div>
                      <span className="text-xs font-medium">{category.label}</span>
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {nodes.length}
                      </Badge>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-1 space-y-1 pl-1">
                    {nodes.map((node) => (
                      <NodeItem
                        key={node.type}
                        node={node}
                        onDragStart={onDragStart}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {Object.keys(filteredNodesByCategory).length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum componente encontrado
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tente buscar por outro termo
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with quick info */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          Arraste os componentes para o canvas
        </p>
      </div>
    </div>
  );
});

// Individual node item component
interface NodeItemProps {
  node: (typeof NODE_TYPE_INFO)[ChatbotNodeType] & { type: ChatbotNodeType };
  onDragStart: (event: React.DragEvent, nodeType: ChatbotNodeType) => void;
}

const NodeItem = memo(function NodeItem({ node, onDragStart }: NodeItemProps) {
  const NodeIcon = Icons[node.icon as keyof typeof Icons] as React.ComponentType<{
    className?: string;
  }>;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className={cn(
              'flex items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-sm transition-all',
              'hover:border-primary hover:shadow-sm hover:bg-accent/50 active:cursor-grabbing cursor-grab',
              'group relative'
            )}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${node.color}15` }}
            >
              {NodeIcon && <NodeIcon className="h-4 w-4" style={{ color: node.color }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-xs truncate">{node.label}</p>
                {node.isNew && (
                  <Badge className="h-4 px-1 text-[9px] bg-green-500/90 hover:bg-green-500">
                    Novo
                  </Badge>
                )}
                {node.isPremium && (
                  <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                )}
                {node.isBeta && (
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">
                    Beta
                  </Badge>
                )}
              </div>
            </div>

            {/* Drag indicator */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Icons.GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium text-sm">{node.label}</p>
            <p className="text-xs text-muted-foreground">{node.description}</p>
            {node.isPremium && (
              <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                <Crown className="h-3 w-3" />
                <span>Recurso Premium</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
