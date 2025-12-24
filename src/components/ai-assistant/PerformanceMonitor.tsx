import React, { useMemo } from 'react';
import {
  Clock,
  MessageSquare,
  Star,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAssistant } from '@/hooks/ai-assistant';
import { useConversationQuality } from '@/hooks/ai-assistant/useConversationQuality';
import { useAuth } from '@/hooks/useAuth';
import {
  formatResponseTime,
  getScoreColor,
} from '@/types/ai-assistant';
import {
  formatPercentageChange,
  formatPointsChange,
} from '@/lib/ai-assistant/performanceCalculator';

export function PerformanceMonitor() {
  const { currentSnapshot, comparison, isLoading } = useAssistant();
  const { user } = useAuth();
  const { averageScores, agentScoreHistory } = useConversationQuality({
    agentId: user?.id,
    enabled: !!user?.id,
  });

  // Gerar dados para mini gráfico de tendência
  const trendData = useMemo(() => {
    if (!agentScoreHistory || agentScoreHistory.length === 0) return [];

    // Agrupar por hora nas últimas 24h
    const now = new Date();
    const hourlyData: { hour: string; score: number; count: number }[] = [];

    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);

      const scoresInHour = agentScoreHistory.filter(s => {
        const scoreTime = new Date(s.analyzed_at);
        return scoreTime >= hourStart && scoreTime < hourEnd;
      });

      if (scoresInHour.length > 0) {
        const avgScore = scoresInHour.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scoresInHour.length;
        hourlyData.push({
          hour: hourStart.toLocaleTimeString('pt-BR', { hour: '2-digit' }),
          score: Math.round(avgScore),
          count: scoresInHour.length,
        });
      }
    }

    return hourlyData;
  }, [agentScoreHistory]);

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
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Sua Performance Hoje
        </h4>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full animate-pulse',
              currentSnapshot.is_online ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {currentSnapshot.is_online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Score Principal com Gráfico de Tendência */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'p-2 rounded-lg',
                getScoreBackgroundClass(currentSnapshot.quality_score_today)
              )}>
                <Target className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Score de Qualidade</span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-2xl font-bold',
                      getScoreColorClass(currentSnapshot.quality_score_today)
                    )}
                  >
                    {currentSnapshot.quality_score_today?.toFixed(0) || '--'}
                  </span>
                  <span className="text-muted-foreground text-sm">/100</span>
                  {metrics && metrics.quality_change !== 0 && (
                    <ChangeIndicator
                      change={formatPointsChange(metrics.quality_change)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Mini Badge de Performance */}
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                getPerformanceBadgeClass(currentSnapshot.quality_score_today)
              )}
            >
              {getPerformanceLabel(currentSnapshot.quality_score_today)}
            </Badge>
          </div>

          {/* Barra de Progresso com Gradiente */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                getProgressGradientClass(currentSnapshot.quality_score_today)
              )}
              style={{ width: `${currentSnapshot.quality_score_today || 0}%` }}
            />
            {/* Marcadores de referência */}
            <div className="absolute inset-0 flex">
              <div className="w-[60%] border-r border-dashed border-muted-foreground/30" />
              <div className="w-[20%] border-r border-dashed border-muted-foreground/30" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>

          {/* Mini Gráfico de Tendência */}
          {trendData.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <TrendingUp className="h-3 w-3" />
                Tendência das últimas horas
              </span>
              <MiniTrendChart data={trendData} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas em Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tempo de Resposta */}
        <MetricCard
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          label="Tempo Médio"
          value={formatResponseTime(currentSnapshot.avg_response_time)}
          change={metrics ? formatPercentageChange(metrics.response_time_change) : null}
          invertColors
          color="blue"
        />

        {/* Conversas */}
        <MetricCard
          icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
          label="Conversas"
          value={currentSnapshot.conversations_handled_today?.toString() || '0'}
          change={metrics ? formatPercentageChange(metrics.conversations_change) : null}
          color="purple"
        />
      </div>

      {/* Breakdown de Scores (se disponível) */}
      {averageScores && (
        <Card>
          <CardContent className="p-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
              <Zap className="h-3 w-3" />
              Breakdown de Performance
            </span>
            <div className="space-y-2">
              <ScoreBreakdownItem
                label="Empatia"
                score={averageScores.empathy}
                icon="💬"
              />
              <ScoreBreakdownItem
                label="Tom"
                score={averageScores.tone}
                icon="🎯"
              />
              <ScoreBreakdownItem
                label="Profissionalismo"
                score={averageScores.professionalism}
                icon="👔"
              />
              <ScoreBreakdownItem
                label="Qualidade"
                score={averageScores.responseQuality}
                icon="✨"
              />
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="mt-2 flex items-center gap-1.5 text-amber-600 bg-amber-50 rounded-lg p-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {currentSnapshot.waiting_conversations} aguardando resposta
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rodapé */}
      <div className="text-center text-[10px] text-muted-foreground">
        Atualizado às {new Date(currentSnapshot.snapshot_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

// Mini Gráfico de Tendência
function MiniTrendChart({ data }: { data: { hour: string; score: number; count: number }[] }) {
  if (data.length === 0) return null;

  const maxScore = Math.max(...data.map(d => d.score), 100);
  const minScore = Math.min(...data.map(d => d.score), 0);
  const range = maxScore - minScore || 1;

  return (
    <div className="flex items-end gap-1 h-12">
      {data.slice(-12).map((point, index) => {
        const height = ((point.score - minScore) / range) * 100;

        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex-1 rounded-t cursor-pointer transition-all hover:opacity-80',
                  getScoreBackgroundClass(point.score)
                )}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="font-medium">{point.hour}h</div>
              <div>Score: {point.score}</div>
              <div className="text-muted-foreground">{point.count} análises</div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

// Breakdown de Score Individual
function ScoreBreakdownItem({ label, score, icon }: { label: string; score: number; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs flex-1">{label}</span>
      <div className="flex items-center gap-2 flex-1">
        <Progress value={score} className="h-1.5 flex-1" />
        <span className={cn('text-xs font-medium w-8 text-right', getScoreColorClass(score))}>
          {score.toFixed(0)}
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
