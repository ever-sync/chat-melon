import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  AgentPerformanceSnapshot,
  AgentPerformanceMetrics,
  LoadLevel,
} from '@/types/ai-assistant';

interface PerformanceComparison {
  today: AgentPerformanceMetrics;
  yesterday: AgentPerformanceMetrics | null;
}

export function useAgentPerformance(agentId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetAgentId = agentId || user?.id;

  // Buscar snapshot mais recente
  const {
    data: currentSnapshot,
    isLoading: isLoadingSnapshot,
    error: snapshotError,
  } = useQuery({
    queryKey: ['agent-performance-snapshot', targetAgentId],
    queryFn: async (): Promise<AgentPerformanceSnapshot | null> => {
      if (!targetAgentId) return null;

      const { data, error } = await supabase
        .from('agent_performance_snapshots')
        .select('*')
        .eq('agent_id', targetAgentId)
        .order('snapshot_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as AgentPerformanceSnapshot;
    },
    enabled: !!targetAgentId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Atualiza a cada minuto
  });

  // Buscar histórico de snapshots (últimas 2 horas)
  const {
    data: snapshots,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ['agent-performance-history', targetAgentId],
    queryFn: async (): Promise<AgentPerformanceSnapshot[]> => {
      if (!targetAgentId) return [];

      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const { data, error } = await supabase
        .from('agent_performance_snapshots')
        .select('*')
        .eq('agent_id', targetAgentId)
        .gte('snapshot_at', twoHoursAgo.toISOString())
        .order('snapshot_at', { ascending: true });

      if (error) throw error;
      return (data || []) as AgentPerformanceSnapshot[];
    },
    enabled: !!targetAgentId,
    staleTime: 60 * 1000,
  });

  // Buscar métricas de qualidade do dia
  const {
    data: qualityMetrics,
    isLoading: isLoadingQuality,
  } = useQuery({
    queryKey: ['agent-quality-today', targetAgentId],
    queryFn: async () => {
      if (!targetAgentId) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('conversation_quality_scores')
        .select('overall_score, analyzed_at')
        .eq('agent_id', targetAgentId)
        .gte('analyzed_at', today.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) return { avgScore: null, count: 0 };

      const scores = data.filter(d => d.overall_score !== null);
      const avgScore = scores.length > 0
        ? scores.reduce((sum, d) => sum + (d.overall_score || 0), 0) / scores.length
        : null;

      return { avgScore, count: data.length };
    },
    enabled: !!targetAgentId,
    staleTime: 60 * 1000,
  });

  // Calcular métricas comparativas
  const {
    data: comparison,
  } = useQuery({
    queryKey: ['agent-performance-comparison', targetAgentId],
    queryFn: async (): Promise<PerformanceComparison | null> => {
      if (!targetAgentId || !currentSnapshot) return null;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      // Buscar snapshot de ontem (média)
      const { data: yesterdaySnapshots } = await supabase
        .from('agent_performance_snapshots')
        .select('*')
        .eq('agent_id', targetAgentId)
        .gte('snapshot_at', yesterday.toISOString())
        .lte('snapshot_at', yesterdayEnd.toISOString());

      let yesterdayMetrics: AgentPerformanceMetrics | null = null;

      if (yesterdaySnapshots && yesterdaySnapshots.length > 0) {
        const avgConversations = yesterdaySnapshots.reduce(
          (sum, s) => sum + (s.conversations_handled_today || 0),
          0
        ) / yesterdaySnapshots.length;

        const avgResponseTime = yesterdaySnapshots.reduce(
          (sum, s) => sum + (s.avg_response_time || 0),
          0
        ) / yesterdaySnapshots.length;

        const avgQuality = yesterdaySnapshots.reduce(
          (sum, s) => sum + (s.quality_score_today || 0),
          0
        ) / yesterdaySnapshots.length;

        yesterdayMetrics = {
          agent_id: targetAgentId,
          agent_name: '',
          conversations_today: avgConversations,
          avg_response_time_today: avgResponseTime,
          quality_score_today: avgQuality,
          conversations_change: 0,
          response_time_change: 0,
          quality_change: 0,
          active_conversations: 0,
          waiting_conversations: 0,
          is_online: false,
          current_load: 'low' as LoadLevel,
        };
      }

      const todayMetrics: AgentPerformanceMetrics = {
        agent_id: targetAgentId,
        agent_name: '',
        conversations_today: currentSnapshot.conversations_handled_today || 0,
        avg_response_time_today: currentSnapshot.avg_response_time || 0,
        quality_score_today: currentSnapshot.quality_score_today || 0,
        conversations_change: yesterdayMetrics
          ? ((currentSnapshot.conversations_handled_today || 0) - yesterdayMetrics.conversations_today) /
            Math.max(yesterdayMetrics.conversations_today, 1) * 100
          : 0,
        response_time_change: yesterdayMetrics && yesterdayMetrics.avg_response_time_today > 0
          ? ((currentSnapshot.avg_response_time || 0) - yesterdayMetrics.avg_response_time_today) /
            yesterdayMetrics.avg_response_time_today * 100
          : 0,
        quality_change: yesterdayMetrics
          ? (currentSnapshot.quality_score_today || 0) - yesterdayMetrics.quality_score_today
          : 0,
        active_conversations: currentSnapshot.active_conversations || 0,
        waiting_conversations: currentSnapshot.waiting_conversations || 0,
        is_online: currentSnapshot.is_online || false,
        current_load: (currentSnapshot.current_load as LoadLevel) || 'low',
      };

      return {
        today: todayMetrics,
        yesterday: yesterdayMetrics,
      };
    },
    enabled: !!targetAgentId && !!currentSnapshot,
    staleTime: 60 * 1000,
  });

  // Real-time subscription para novos snapshots
  useEffect(() => {
    if (!targetAgentId) return;

    const channel = supabase
      .channel(`agent-performance-${targetAgentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_performance_snapshots',
          filter: `agent_id=eq.${targetAgentId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ['agent-performance-snapshot', targetAgentId],
            payload.new as AgentPerformanceSnapshot
          );
          queryClient.invalidateQueries({
            queryKey: ['agent-performance-history', targetAgentId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetAgentId, queryClient]);

  // Mutation para atualizar manualmente os snapshots de performance
  const refreshPerformanceMutation = useMutation({
    mutationFn: async (params?: { companyId?: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-analyze-agent-performance', {
        body: {
          agent_id: targetAgentId,
          company_id: params?.companyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['agent-performance-snapshot', targetAgentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['agent-performance-history', targetAgentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['agent-quality-today', targetAgentId],
      });
    },
  });

  // Callback para refresh manual
  const refreshPerformance = useCallback(
    (companyId?: string) => refreshPerformanceMutation.mutate({ companyId }),
    [refreshPerformanceMutation]
  );

  return {
    currentSnapshot,
    snapshots: snapshots || [],
    qualityMetrics,
    comparison,
    isLoading: isLoadingSnapshot || isLoadingHistory || isLoadingQuality,
    error: snapshotError,
    refreshPerformance,
    isRefreshing: refreshPerformanceMutation.isPending,
  };
}

// Hook para métricas da equipe inteira (para gestores)
export function useTeamPerformance(companyId?: string) {
  const {
    data: teamMetrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['team-performance', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      // Buscar snapshots mais recentes de cada agente
      const { data: latestSnapshots, error: snapshotsError } = await supabase
        .from('agent_performance_snapshots')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .order('snapshot_at', { ascending: false });

      if (snapshotsError) throw snapshotsError;

      // Agrupar por agente (pegar apenas o mais recente de cada)
      const agentMap = new Map<string, AgentPerformanceSnapshot & { agent: { id: string; full_name: string; avatar_url?: string } }>();

      for (const snapshot of latestSnapshots || []) {
        if (!agentMap.has(snapshot.agent_id)) {
          agentMap.set(snapshot.agent_id, snapshot as any);
        }
      }

      const agents = Array.from(agentMap.values());

      // Calcular métricas agregadas
      const totalConversations = agents.reduce(
        (sum, a) => sum + (a.conversations_handled_today || 0),
        0
      );

      const avgResponseTime = agents.length > 0
        ? agents.reduce((sum, a) => sum + (a.avg_response_time || 0), 0) / agents.length
        : 0;

      const avgQuality = agents.length > 0
        ? agents.reduce((sum, a) => sum + (a.quality_score_today || 0), 0) / agents.length
        : 0;

      const agentMetrics: AgentPerformanceMetrics[] = agents.map((a) => ({
        agent_id: a.agent_id,
        agent_name: a.agent?.full_name || 'Desconhecido',
        avatar_url: a.agent?.avatar_url,
        conversations_today: a.conversations_handled_today || 0,
        avg_response_time_today: a.avg_response_time || 0,
        quality_score_today: a.quality_score_today || 0,
        conversations_change: 0,
        response_time_change: 0,
        quality_change: 0,
        active_conversations: a.active_conversations || 0,
        waiting_conversations: a.waiting_conversations || 0,
        is_online: a.is_online || false,
        current_load: (a.current_load as LoadLevel) || 'low',
      }));

      return {
        total_conversations: totalConversations,
        avg_response_time: avgResponseTime,
        avg_quality_score: avgQuality,
        agents: agentMetrics,
        online_agents: agents.filter((a) => a.is_online).length,
        total_agents: agents.length,
      };
    },
    enabled: !!companyId,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // Atualiza a cada 2 minutos
  });

  return {
    teamMetrics,
    isLoading,
    error,
  };
}
