import React from 'react';
import {
  Clock,
  MessageSquare,
  Star,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssistant } from '@/hooks/ai-assistant';
import {
  formatResponseTime,
  getScoreColor,
  getLoadColor,
} from '@/types/ai-assistant';
import {
  formatPercentageChange,
  formatPointsChange,
} from '@/lib/ai-assistant/performanceCalculator';

export function PerformanceMonitor() {
  const { currentSnapshot, comparison, isLoading } = useAssistant();

  if (isLoading) {
    return <PerformanceMonitorSkeleton />;
  }

  if (!currentSnapshot) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Ainda não há dados de performance disponíveis.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Continue atendendo para ver suas métricas.
        </p>
      </div>
    );
  }

  const metrics = comparison?.today;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Star className="h-4 w-4 text-primary" />
        Sua Performance Hoje
      </h4>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tempo de Resposta */}
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Tempo Médio"
          value={formatResponseTime(currentSnapshot.avg_response_time)}
          change={metrics ? formatPercentageChange(metrics.response_time_change) : null}
          invertColors // Menor tempo é melhor
        />

        {/* Conversas */}
        <MetricCard
          icon={<MessageSquare className="h-4 w-4" />}
          label="Conversas"
          value={currentSnapshot.conversations_handled_today?.toString() || '0'}
          change={metrics ? formatPercentageChange(metrics.conversations_change) : null}
        />
      </div>

      {/* Score de Qualidade */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Score de Qualidade</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-lg font-bold',
                  getScoreColorClass(currentSnapshot.quality_score_today)
                )}
              >
                {currentSnapshot.quality_score_today?.toFixed(0) || '--'}/100
              </span>
              {metrics && metrics.quality_change !== 0 && (
                <ChangeIndicator
                  change={formatPointsChange(metrics.quality_change)}
                />
              )}
            </div>
          </div>

          <Progress
            value={currentSnapshot.quality_score_today || 0}
            className="h-2"
          />

          {/* Breakdown de scores seria adicionado aqui */}
        </CardContent>
      </Card>

      {/* Conversas Ativas */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Conversas Ativas</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold">
                {currentSnapshot.active_conversations}
              </span>
              <span className="text-sm text-muted-foreground ml-1">conversas</span>
            </div>

            <div
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getLoadBadgeClass(currentSnapshot.current_load)
              )}
            >
              {getLoadLabel(currentSnapshot.current_load)}
            </div>
          </div>

          {currentSnapshot.waiting_conversations > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs">
                {currentSnapshot.waiting_conversations} aguardando resposta
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Online */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              currentSnapshot.is_online ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span>
            {currentSnapshot.is_online ? 'Online' : 'Offline'}
          </span>
        </div>
        <span>
          Atualizado às {new Date(currentSnapshot.snapshot_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// Componente de card de métrica
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: ReturnType<typeof formatPercentageChange> | null;
  invertColors?: boolean;
}

function MetricCard({ icon, label, value, change, invertColors }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{value}</span>
          {change && (
            <ChangeIndicator change={change} invertColors={invertColors} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de indicador de mudança
interface ChangeIndicatorProps {
  change: { text: string; color: string; icon: 'up' | 'down' | 'stable' };
  invertColors?: boolean;
}

function ChangeIndicator({ change, invertColors }: ChangeIndicatorProps) {
  let colorClass = 'text-muted-foreground';

  if (change.icon === 'up') {
    colorClass = invertColors ? 'text-red-500' : 'text-green-500';
  } else if (change.icon === 'down') {
    colorClass = invertColors ? 'text-green-500' : 'text-red-500';
  }

  const Icon = change.icon === 'up' ? TrendingUp : change.icon === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn('flex items-center gap-0.5 text-xs', colorClass)}>
      <Icon className="h-3 w-3" />
      <span>{change.text}</span>
    </div>
  );
}

// Skeleton para loading
function PerformanceMonitorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-20" />
    </div>
  );
}

// Utilitários
function getScoreColorClass(score: number | null): string {
  const color = getScoreColor(score);
  switch (color) {
    case 'green': return 'text-green-600';
    case 'yellow': return 'text-yellow-600';
    case 'red': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
}

function getLoadBadgeClass(load: string | null): string {
  switch (load) {
    case 'low': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'overloaded': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getLoadLabel(load: string | null): string {
  switch (load) {
    case 'low': return 'Carga baixa';
    case 'medium': return 'Carga média';
    case 'high': return 'Carga alta';
    case 'overloaded': return 'Sobrecarregado';
    default: return 'Desconhecido';
  }
}

export default PerformanceMonitor;
