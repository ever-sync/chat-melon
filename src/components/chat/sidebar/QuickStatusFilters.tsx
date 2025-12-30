import { MessageCircle, Clock, Bot, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterMode = 'all' | 'atendimento' | 'aguardando' | 'bot' | 'ia' | 'groups';

interface QuickStatusFiltersProps {
  selectedMode: FilterMode;
  onModeChange: (mode: FilterMode) => void;
  counts: {
    all: number;
    atendimento: number;
    aguardando: number;
    bot: number;
    ia: number;
    groups: number;
  };
}

export function QuickStatusFilters({ selectedMode, onModeChange, counts }: QuickStatusFiltersProps) {
  const filters = [
    {
      mode: 'all' as FilterMode,
      label: 'Inbox',
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      activeColor: 'bg-blue-100',
    },
    {
      mode: 'atendimento' as FilterMode,
      label: 'Atendimento',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      activeColor: 'bg-green-100',
    },
    {
      mode: 'aguardando' as FilterMode,
      label: 'Aguardando',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      activeColor: 'bg-orange-100',
    },
    {
      mode: 'bot' as FilterMode,
      label: 'No Bot',
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      activeColor: 'bg-purple-100',
    },
    {
      mode: 'ia' as FilterMode,
      label: 'IA',
      icon: Sparkles,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      activeColor: 'bg-pink-100',
    },
    {
      mode: 'groups' as FilterMode,
      label: 'Grupos',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      activeColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="px-4 py-3 border-b border-border bg-muted/30">
      <div className="grid grid-cols-3 gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = selectedMode === filter.mode;
          const count = counts[filter.mode] || 0;

          return (
            <button
              key={filter.mode}
              onClick={() => onModeChange(filter.mode)}
              className={cn(
                'relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? `${filter.activeColor} ${filter.borderColor} shadow-sm`
                  : 'bg-background border-border hover:bg-muted/50'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full mb-1.5 transition-colors',
                  isActive ? filter.bgColor : 'bg-muted'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? filter.color : 'text-muted-foreground'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {filter.label}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    'absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1',
                    'rounded-full text-[10px] font-bold',
                    isActive
                      ? `${filter.color} ${filter.bgColor} border border-current`
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
