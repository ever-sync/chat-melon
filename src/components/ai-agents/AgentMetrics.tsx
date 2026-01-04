import { useState } from 'react';
import { useAIAgentMetrics, useAIAgentSessions } from '@/hooks/ai-agents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart3,
  MessageSquare,
  Clock,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { AIAgent, AIAgentSession, AIAgentMetrics as MetricsType, getSessionStatusColor } from '@/types/ai-agents';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgentMetricsProps {
  agent: AIAgent;
}

const SESSION_STATUS_LABELS: Record<AIAgentSession['status'], string> = {
  active: 'Ativa',
  waiting_response: 'Aguardando',
  handed_off: 'Transferida',
  completed: 'Concluída',
  abandoned: 'Abandonada',
  failed: 'Falhou',
};

export function AgentMetrics({ agent }: AgentMetricsProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: metrics, isLoading: loadingMetrics } = useAIAgentMetrics(agent.id, period);
  const { data: recentSessions, isLoading: loadingSessions } = useAIAgentSessions(agent.id, { limit: 10 });
  const { data: activeSessions } = useAIAgentSessions(agent.id, { status: 'active', limit: 5 });

  // Calcular métricas agregadas
  const latestMetric = metrics?.[0];
  const previousMetric = metrics?.[1];

  const calculateChange = (current?: number, previous?: number) => {
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: AIAgentSession['status']) => {
    const color = getSessionStatusColor(status);
    const variants: Record<string, string> = {
      green: 'bg-green-100 text-green-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      blue: 'bg-blue-100 text-blue-700',
      gray: 'bg-gray-100 text-gray-700',
      orange: 'bg-orange-100 text-orange-700',
      red: 'bg-red-100 text-red-700',
    };

    return (
      <Badge variant="outline" className={cn('text-xs', variants[color])}>
        {SESSION_STATUS_LABELS[status]}
      </Badge>
    );
  };

  if (loadingMetrics) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-6">
              <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={agent.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              <Bot className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{agent.name}</h2>
            <p className="text-sm text-muted-foreground">Métricas e Performance</p>
          </div>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diário</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total de Sessões"
          value={latestMetric?.total_sessions || agent.total_sessions || 0}
          change={calculateChange(latestMetric?.total_sessions, previousMetric?.total_sessions)}
          icon={MessageSquare}
        />
        <MetricCard
          title="Taxa de Resolução"
          value={`${Math.round((latestMetric?.resolution_rate || agent.resolution_rate || 0) * 100)}%`}
          change={calculateChange(latestMetric?.resolution_rate, previousMetric?.resolution_rate)}
          icon={CheckCircle}
        />
        <MetricCard
          title="Tempo Médio de Resposta"
          value={formatDuration(latestMetric?.avg_response_time_ms ? latestMetric.avg_response_time_ms / 1000 : undefined)}
          change={-calculateChange(latestMetric?.avg_response_time_ms, previousMetric?.avg_response_time_ms)} // Inverso - menor é melhor
          icon={Clock}
        />
        <MetricCard
          title="Satisfação"
          value={latestMetric?.avg_rating ? `${latestMetric.avg_rating.toFixed(1)}/5` : `${agent.satisfaction_score?.toFixed(1) || '-'}/5`}
          change={calculateChange(latestMetric?.avg_rating, previousMetric?.avg_rating)}
          icon={Star}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="intents">Intenções</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Mensagens Enviadas"
              value={latestMetric?.total_messages_sent || agent.total_messages_sent || 0}
              icon={<MessageSquare className="h-4 w-4" />}
            />
            <StatCard
              label="Handoffs"
              value={latestMetric?.sessions_handed_off || agent.total_handoffs || 0}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Msgs por Sessão"
              value={latestMetric?.avg_messages_per_session?.toFixed(1) || agent.avg_messages_per_session?.toFixed(1) || '-'}
              icon={<Zap className="h-4 w-4" />}
            />
            <StatCard
              label="Duração Média"
              value={formatDuration(latestMetric?.avg_session_duration_seconds || agent.avg_session_duration)}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          {/* Sessões Ativas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessões Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {!activeSessions?.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma sessão ativa no momento
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.contact?.name} />
                          <AvatarFallback>
                            {session.contact?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{session.contact?.name || 'Contato'}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.messages_sent + session.messages_received} mensagens
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.last_activity_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribuição de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição de Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <ResultCard
                  label="Concluídas"
                  value={latestMetric?.sessions_completed || 0}
                  total={latestMetric?.total_sessions || 1}
                  color="green"
                />
                <ResultCard
                  label="Transferidas"
                  value={latestMetric?.sessions_handed_off || 0}
                  total={latestMetric?.total_sessions || 1}
                  color="blue"
                />
                <ResultCard
                  label="Abandonadas"
                  value={latestMetric?.sessions_abandoned || 0}
                  total={latestMetric?.total_sessions || 1}
                  color="orange"
                />
                <ResultCard
                  label="Falhas"
                  value={latestMetric?.sessions_failed || 0}
                  total={latestMetric?.total_sessions || 1}
                  color="red"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessões Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="text-center py-4 text-muted-foreground">Carregando...</div>
              ) : !recentSessions?.length ? (
                <div className="text-center py-4 text-muted-foreground">Nenhuma sessão encontrada</div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {session.contact?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{session.contact?.name || 'Contato Desconhecido'}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{session.messages_sent + session.messages_received} mensagens</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(session.started_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {session.customer_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm">{session.customer_rating}</span>
                          </div>
                        )}
                        {getStatusBadge(session.status)}
                        {session.handed_off_to && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                            <span>Transferida</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Intenções Detectadas</CardTitle>
              <CardDescription>
                Principais intenções identificadas nas conversas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!latestMetric?.top_intents?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma intenção registrada ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {latestMetric.top_intents.map((intent, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{intent.intent}</span>
                          <span className="text-sm text-muted-foreground">
                            {intent.count}x ({intent.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${intent.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Erros e Problemas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!latestMetric?.errors_count ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum erro registrado
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-700">Total de Erros</span>
                      <Badge variant="destructive">{latestMetric.errors_count}</Badge>
                    </div>
                  </div>
                  {latestMetric.error_types && Object.entries(latestMetric.error_types).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componentes auxiliares

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: typeof MessageSquare;
}

function MetricCard({ title, value, change, icon: Icon }: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {change !== 0 && (
            <span className={cn(
              'flex items-center text-sm',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}

interface ResultCardProps {
  label: string;
  value: number;
  total: number;
  color: 'green' | 'blue' | 'orange' | 'red';
}

function ResultCard({ label, value, total, color }: ResultCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
    </div>
  );
}
