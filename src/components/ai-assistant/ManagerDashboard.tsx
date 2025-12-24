import React, { useState } from 'react';
import {
  BarChart2,
  Users,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Trophy,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTeamPerformance } from '@/hooks/ai-assistant/useAgentPerformance';
import { usePatternDetection } from '@/hooks/ai-assistant/usePatternDetection';
import { useCoachingInsights } from '@/hooks/ai-assistant/useCoachingInsights';
import {
  AgentPerformanceMetrics,
  LoadLevel,
  formatResponseTime,
  getScoreColor,
} from '@/types/ai-assistant';
import { getPatternTypeIcon, getPatternTypeLabel, getImpactColor } from '@/hooks/ai-assistant/usePatternDetection';
import { getCategoryIcon, getCategoryLabel } from '@/hooks/ai-assistant/useCoachingInsights';

interface ManagerDashboardProps {
  companyId: string;
}

export function ManagerDashboard({ companyId }: ManagerDashboardProps) {
  const { teamMetrics, isLoading: isLoadingTeam } = useTeamPerformance(companyId);
  const { patterns, highImpactPatterns, isLoading: isLoadingPatterns } = usePatternDetection({
    companyId,
  });
  const { insights, concerns, recentAchievements, isLoading: isLoadingInsights } = useCoachingInsights({
    companyId,
    includeAllAgents: true,
  });

  const isLoading = isLoadingTeam || isLoadingPatterns || isLoadingInsights;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Separar agentes por performance
  const sortedAgents = [...(teamMetrics?.agents || [])].sort(
    (a, b) => (b.quality_score_today || 0) - (a.quality_score_today || 0)
  );
  const topPerformers = sortedAgents.slice(0, 3);
  const needsAttention = sortedAgents.filter(
    (a) => a.current_load === 'overloaded' || (a.quality_score_today || 0) < 70
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
          <p className="text-muted-foreground">
            Visão geral da equipe de atendimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Conversas Hoje"
          value={teamMetrics?.total_conversations?.toString() || '0'}
          icon={<Users className="h-5 w-5" />}
          trend={12}
          color="blue"
        />
        <KPICard
          title="Tempo Médio"
          value={formatResponseTime(teamMetrics?.avg_response_time || 0)}
          icon={<Clock className="h-5 w-5" />}
          trend={-18}
          invertTrend
          color="green"
        />
        <KPICard
          title="Score Qualidade"
          value={`${teamMetrics?.avg_quality_score?.toFixed(0) || 0}/100`}
          icon={<Star className="h-5 w-5" />}
          trend={-3}
          isPoints
          color="yellow"
        />
        <KPICard
          title="Agentes Online"
          value={`${teamMetrics?.online_agents || 0}/${teamMetrics?.total_agents || 0}`}
          icon={<Users className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Performance Individual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance Individual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead className="text-center">Conversas</TableHead>
                <TableHead className="text-center">Tempo</TableHead>
                <TableHead className="text-center">Qualidade</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAgents.map((agent) => (
                <AgentRow key={agent.agent_id} agent={agent} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Padrões Detectados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Padrões Detectados
              {highImpactPatterns.length > 0 && (
                <Badge variant="destructive">{highImpactPatterns.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patterns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum padrão detectado
              </p>
            ) : (
              <div className="space-y-3">
                {patterns.slice(0, 5).map((pattern) => (
                  <div
                    key={pattern.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      pattern.impact_level === 'high' && 'border-red-200 bg-red-50',
                      pattern.impact_level === 'medium' && 'border-yellow-200 bg-yellow-50',
                      pattern.impact_level === 'low' && 'border-green-200 bg-green-50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getPatternTypeIcon(pattern.pattern_type)}</span>
                      <span className="font-medium text-sm">
                        {pattern.pattern_name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'ml-auto text-xs',
                          pattern.impact_level === 'high' && 'border-red-500 text-red-600',
                          pattern.impact_level === 'medium' && 'border-yellow-500 text-yellow-600',
                          pattern.impact_level === 'low' && 'border-green-500 text-green-600'
                        )}
                      >
                        {pattern.impact_level}
                      </Badge>
                    </div>
                    {pattern.description && (
                      <p className="text-xs text-muted-foreground">
                        {pattern.description}
                      </p>
                    )}
                    {pattern.recommended_actions?.[0] && (
                      <p className="text-xs text-primary mt-1">
                        Ação: {pattern.recommended_actions[0].action}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights de Coaching */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Insights de Coaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Destaque */}
            {recentAchievements.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <span className="text-purple-500">Conquistas Recentes</span>
                </h4>
                {recentAchievements.slice(0, 2).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-2 rounded bg-purple-50 border border-purple-200 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={achievement.agent?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {achievement.agent?.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-xs font-medium">
                          {achievement.agent?.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          - {achievement.title}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Preocupações */}
            {concerns.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <span className="text-red-500">Precisa de Atenção</span>
                </h4>
                {concerns.slice(0, 3).map((concern) => (
                  <div
                    key={concern.id}
                    className="p-2 rounded bg-red-50 border border-red-200 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={concern.agent?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {concern.agent?.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="text-xs font-medium">
                          {concern.agent?.full_name}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {concern.title}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {concerns.length === 0 && recentAchievements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum insight disponível
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componentes auxiliares

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  invertTrend?: boolean;
  isPoints?: boolean;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

function KPICard({ title, value, icon, trend, invertTrend, isPoints, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    const isPositive = invertTrend ? trend < 0 : trend > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className={cn('p-2 rounded-full', colorClasses[color])}>
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold">{value}</span>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-0.5 text-sm', getTrendColor())}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {trend > 0 ? '+' : ''}
                {isPoints ? `${trend}pts` : `${trend.toFixed(0)}%`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentRow({ agent }: { agent: AgentPerformanceMetrics }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={agent.avatar_url} />
              <AvatarFallback className="text-xs">
                {agent.agent_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
                agent.is_online ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
          </div>
          <span className="font-medium text-sm">{agent.agent_name}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">{agent.conversations_today}</TableCell>
      <TableCell className="text-center">
        {formatResponseTime(agent.avg_response_time_today)}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <span
            className={cn(
              'font-medium',
              agent.quality_score_today >= 80 && 'text-green-600',
              agent.quality_score_today >= 60 && agent.quality_score_today < 80 && 'text-yellow-600',
              agent.quality_score_today < 60 && 'text-red-600'
            )}
          >
            {agent.quality_score_today?.toFixed(0) || '--'}
          </span>
          <span className="text-muted-foreground">/100</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={cn(
            agent.current_load === 'low' && 'border-green-500 text-green-600',
            agent.current_load === 'medium' && 'border-yellow-500 text-yellow-600',
            agent.current_load === 'high' && 'border-orange-500 text-orange-600',
            agent.current_load === 'overloaded' && 'border-red-500 text-red-600'
          )}
        >
          {agent.current_load === 'overloaded'
            ? 'Sobrecarga'
            : agent.current_load === 'high'
            ? 'Alta'
            : agent.current_load === 'medium'
            ? 'Média'
            : 'Baixa'}
        </Badge>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default ManagerDashboard;
