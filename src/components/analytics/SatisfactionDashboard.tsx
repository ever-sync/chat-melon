import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { useSatisfaction } from '@/hooks/useSatisfaction';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const SatisfactionDashboard = () => {
  const { getMetrics, getMetricsByAgent, getNegativeFeedback, loading } = useSatisfaction();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [agents, setAgents] = useState<Record<string, any>>({});

  const metrics = getMetrics(period);
  const agentMetrics = getMetricsByAgent();
  const negativeFeedback = getNegativeFeedback();

  useEffect(() => {
    loadAgents();
  }, [agentMetrics]);

  const loadAgents = async () => {
    const agentIds = agentMetrics.map((a) => a.agent_id);
    if (agentIds.length === 0) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', agentIds);

    if (data) {
      const agentsMap = data.reduce(
        (acc, agent) => {
          acc[agent.id] = agent;
          return acc;
        },
        {} as Record<string, any>
      );
      setAgents(agentsMap);
    }
  };

  const getScoreColor = (score: number, type: 'csat' | 'nps') => {
    if (type === 'csat') {
      if (score >= 4) return 'text-green-600';
      if (score >= 3) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (score >= 9) return 'text-green-600';
      if (score >= 7) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getScoreBadge = (score: number, type: 'csat' | 'nps') => {
    if (type === 'csat') {
      if (score >= 4) return { label: 'Excelente', variant: 'default' as const };
      if (score >= 3) return { label: 'Regular', variant: 'secondary' as const };
      return { label: 'Ruim', variant: 'destructive' as const };
    } else {
      if (score >= 9) return { label: 'Promotor', variant: 'default' as const };
      if (score >= 7) return { label: 'Neutro', variant: 'secondary' as const };
      return { label: 'Detrator', variant: 'destructive' as const };
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Satisfação dos Clientes</h2>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="quarter">Último trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">{metrics.totalResponses} respostas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseRate.toFixed(0)}%</div>
          </CardContent>
        </Card>

        {metrics.npsScore !== undefined && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.npsScore.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.promoters}P / {metrics.passives}N / {metrics.detractors}D
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ranking por Atendente</CardTitle>
            <CardDescription>Notas médias de satisfação</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {agentMetrics.map((agent, index) => {
                  const agentData = agents[agent.agent_id];
                  return (
                    <div key={agent.agent_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agentData?.avatar_url} />
                          <AvatarFallback>
                            {agentData?.full_name?.substring(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{agentData?.full_name || 'Desconhecido'}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.total_responses} respostas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-bold">{agent.avg_score.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedbacks Negativos Recentes</CardTitle>
            <CardDescription>Últimas 10 avaliações baixas com comentários</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {negativeFeedback.map((survey) => (
                  <div key={survey.id} className="space-y-2 pb-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {[...Array(survey.survey_type === 'csat' ? 5 : 10)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < (survey.score || 0)
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="font-bold">{survey.score}</span>
                      </div>
                      <Badge variant={getScoreBadge(survey.score || 0, survey.survey_type).variant}>
                        {getScoreBadge(survey.score || 0, survey.survey_type).label}
                      </Badge>
                    </div>
                    {survey.feedback && (
                      <p className="text-sm text-muted-foreground italic">"{survey.feedback}"</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(survey.answered_at || '').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
                {negativeFeedback.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum feedback negativo no período
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
