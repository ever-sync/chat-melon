import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  DollarSign,
  TrendingUp,
  CheckSquare,
  BarChart3,
  Users,
  Calendar,
  Target,
  Award,
  Clock,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  category: 'metrics' | 'charts' | 'lists';
}

export const availableWidgets: WidgetConfig[] = [
  {
    id: 'conversations',
    title: 'Total de Conversas',
    description: 'Quantidade total de conversas',
    icon: MessageSquare,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    category: 'metrics',
  },
  {
    id: 'revenue',
    title: 'Receita Total',
    description: 'Valor total de negócios ganhos',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10',
    category: 'metrics',
  },
  {
    id: 'deals',
    title: 'Negócios Abertos',
    description: 'Quantidade de deals em andamento',
    icon: TrendingUp,
    color: 'text-violet-600',
    bgColor: 'bg-violet-600/10',
    category: 'metrics',
  },
  {
    id: 'tasks',
    title: 'Tarefas Pendentes',
    description: 'Tarefas a fazer',
    icon: CheckSquare,
    color: 'text-orange-600',
    bgColor: 'bg-orange-600/10',
    category: 'metrics',
  },
  {
    id: 'revenue-chart',
    title: 'Gráfico de Receita',
    description: 'Evolução da receita nos últimos meses',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    category: 'charts',
  },
  {
    id: 'recent-conversations',
    title: 'Conversas Recentes',
    description: 'Últimas conversas com clientes',
    icon: MessageSquare,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    category: 'lists',
  },
  {
    id: 'today-tasks',
    title: 'Tarefas de Hoje',
    description: 'Tarefas agendadas para hoje',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-600/10',
    category: 'lists',
  },
  {
    id: 'top-contacts',
    title: 'Top Contatos',
    description: 'Contatos com mais interações',
    icon: Users,
    color: 'text-pink-600',
    bgColor: 'bg-pink-600/10',
    category: 'lists',
  },
  {
    id: 'conversion-rate',
    title: 'Taxa de Conversão',
    description: 'Porcentagem de deals ganhos',
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
    category: 'metrics',
  },
  {
    id: 'response-time',
    title: 'Tempo de Resposta',
    description: 'Tempo médio de primeira resposta',
    icon: Clock,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-600/10',
    category: 'metrics',
  },
  {
    id: 'achievements',
    title: 'Conquistas',
    description: 'Metas e conquistas da equipe',
    icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-600/10',
    category: 'lists',
  },
  {
    id: 'pipeline-stats',
    title: 'Leads por Pipeline',
    description: 'Quantidade de leads por etapa',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    category: 'charts',
  },
  {
    id: 'leads-by-period',
    title: 'Leads Criados',
    description: 'Leads criados por período (diário, semanal, mensal)',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    category: 'metrics',
  },
  {
    id: 'agent-performance',
    title: 'Desempenho de Atendentes',
    description: 'Ranking e métricas dos atendentes (conversas, vendas, tempo de resposta)',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    category: 'lists',
  },
];

interface WidgetsSidebarProps {
  activeWidgets: string[];
  onAddWidget: (widgetId: string) => void;
  onClose: () => void;
}

export function WidgetsSidebar({ activeWidgets, onAddWidget, onClose }: WidgetsSidebarProps) {
  const categories = {
    metrics: 'Métricas',
    charts: 'Gráficos',
    lists: 'Listas',
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Widgets Disponíveis</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg">
            Fechar
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Clique no + para adicionar um widget ao dashboard
        </p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {Object.entries(categories).map(([key, label]) => {
          const widgets = availableWidgets.filter((w) => w.category === key);

          return (
            <div key={key}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {label}
              </h3>
              <div className="space-y-2">
                {widgets.map((widget) => {
                  const isActive = activeWidgets.includes(widget.id);

                  return (
                    <Card
                      key={widget.id}
                      className={cn(
                        'p-4 cursor-pointer transition-all',
                        isActive
                          ? 'bg-gray-50 border-gray-200 opacity-50'
                          : 'hover:shadow-md hover:border-indigo-200'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn('p-2 rounded-lg', widget.bgColor)}>
                            <widget.icon className={cn('h-5 w-5', widget.color)} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{widget.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{widget.description}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isActive ? 'ghost' : 'default'}
                          disabled={isActive}
                          onClick={() => !isActive && onAddWidget(widget.id)}
                          className={cn(
                            'rounded-lg',
                            !isActive &&
                              'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/30'
                          )}
                        >
                          {isActive ? (
                            <span className="text-xs">Adicionado</span>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
