import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  CoachingInsight,
  CoachingCategory,
  InsightStatus,
} from '@/types/ai-assistant';

interface UseCoachingInsightsOptions {
  agentId?: string;
  companyId?: string;
  includeAllAgents?: boolean;
  enabled?: boolean;
}

export function useCoachingInsights({
  agentId,
  companyId,
  includeAllAgents = false,
  enabled = true,
}: UseCoachingInsightsOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetAgentId = agentId || user?.id;

  // Buscar insights de coaching
  const {
    data: insights,
    isLoading: isLoadingInsights,
    error: insightsError,
  } = useQuery({
    queryKey: ['coaching-insights', companyId, targetAgentId, includeAllAgents],
    queryFn: async (): Promise<CoachingInsight[]> => {
      if (!companyId) return [];

      let query = supabase
        .from('coaching_insights')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Se for agente específico e não incluir todos
      if (targetAgentId && !includeAllAgents) {
        query = query.eq('agent_id', targetAgentId);
      }

      // Limitar para os últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return (data || []) as CoachingInsight[];
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Agrupar por categoria
  const insightsByCategory = {
    strength: insights?.filter((i) => i.category === 'strength') || [],
    improvement_area: insights?.filter((i) => i.category === 'improvement_area') || [],
    achievement: insights?.filter((i) => i.category === 'achievement') || [],
    concern: insights?.filter((i) => i.category === 'concern') || [],
  };

  // Insights não reconhecidos (novos)
  const newInsights = insights?.filter((i) => i.status === 'new') || [];

  // Insights que precisam de atenção (concerns não resolvidos)
  const concerns = insights?.filter(
    (i) => i.category === 'concern' && i.status !== 'resolved'
  ) || [];

  // Conquistas recentes
  const recentAchievements = insights?.filter(
    (i) => i.category === 'achievement' && i.status === 'new'
  ) || [];

  // Mutation para reconhecer insight
  const acknowledgeInsightMutation = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('coaching_insights')
        .update({
          status: 'acknowledged' as InsightStatus,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coaching-insights', companyId],
      });
    },
  });

  // Mutation para marcar insight como em progresso
  const startInsightMutation = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('coaching_insights')
        .update({
          status: 'in_progress' as InsightStatus,
        })
        .eq('id', insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coaching-insights', companyId],
      });
    },
  });

  // Mutation para resolver insight
  const resolveInsightMutation = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('coaching_insights')
        .update({
          status: 'resolved' as InsightStatus,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coaching-insights', companyId],
      });
    },
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      insightId,
      status,
    }: {
      insightId: string;
      status: InsightStatus;
    }) => {
      const updates: Record<string, unknown> = { status };

      if (status === 'acknowledged') {
        updates.acknowledged_at = new Date().toISOString();
      } else if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('coaching_insights')
        .update(updates)
        .eq('id', insightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['coaching-insights', companyId],
      });
    },
  });

  // Real-time subscription para novos insights
  useEffect(() => {
    if (!targetAgentId && !includeAllAgents) return;
    if (!companyId) return;

    const filter = includeAllAgents
      ? `company_id=eq.${companyId}`
      : `agent_id=eq.${targetAgentId}`;

    const channel = supabase
      .channel(`insights-${targetAgentId || companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coaching_insights',
          filter,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['coaching-insights', companyId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetAgentId, companyId, includeAllAgents, queryClient]);

  return {
    insights: insights || [],
    insightsByCategory,
    newInsights,
    concerns,
    recentAchievements,
    newCount: newInsights.length,
    concernCount: concerns.length,
    isLoading: isLoadingInsights,
    error: insightsError,
    acknowledgeInsight: acknowledgeInsightMutation.mutate,
    startInsight: startInsightMutation.mutate,
    resolveInsight: resolveInsightMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isUpdating:
      acknowledgeInsightMutation.isPending ||
      startInsightMutation.isPending ||
      resolveInsightMutation.isPending ||
      updateStatusMutation.isPending,
  };
}

// Hook para buscar insights de um agente específico (para gestores)
export function useAgentInsights(agentId?: string, companyId?: string) {
  const {
    data: agentInsights,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agent-insights', agentId, companyId],
    queryFn: async (): Promise<{
      strengths: CoachingInsight[];
      improvements: CoachingInsight[];
      achievements: CoachingInsight[];
      concerns: CoachingInsight[];
      summary: {
        totalStrengths: number;
        totalImprovements: number;
        totalAchievements: number;
        totalConcerns: number;
        resolvedThisMonth: number;
      };
    }> => {
      if (!agentId || !companyId) {
        return {
          strengths: [],
          improvements: [],
          achievements: [],
          concerns: [],
          summary: {
            totalStrengths: 0,
            totalImprovements: 0,
            totalAchievements: 0,
            totalConcerns: 0,
            resolvedThisMonth: 0,
          },
        };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('coaching_insights')
        .select('*')
        .eq('agent_id', agentId)
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const insights = (data || []) as CoachingInsight[];

      const strengths = insights.filter((i) => i.category === 'strength');
      const improvements = insights.filter((i) => i.category === 'improvement_area');
      const achievements = insights.filter((i) => i.category === 'achievement');
      const concerns = insights.filter((i) => i.category === 'concern');

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const resolvedThisMonth = insights.filter(
        (i) =>
          i.status === 'resolved' &&
          i.resolved_at &&
          new Date(i.resolved_at) >= thisMonth
      ).length;

      return {
        strengths,
        improvements,
        achievements,
        concerns,
        summary: {
          totalStrengths: strengths.length,
          totalImprovements: improvements.length,
          totalAchievements: achievements.length,
          totalConcerns: concerns.length,
          resolvedThisMonth,
        },
      };
    },
    enabled: !!agentId && !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    agentInsights,
    isLoading,
    error,
  };
}

// Utilitário para obter ícone da categoria
export function getCategoryIcon(category: CoachingCategory): string {
  switch (category) {
    case 'strength': return '💪';
    case 'improvement_area': return '📈';
    case 'achievement': return '🏆';
    case 'concern': return '⚠️';
    default: return '💡';
  }
}

// Utilitário para obter label da categoria
export function getCategoryLabel(category: CoachingCategory): string {
  switch (category) {
    case 'strength': return 'Ponto Forte';
    case 'improvement_area': return 'Área de Melhoria';
    case 'achievement': return 'Conquista';
    case 'concern': return 'Preocupação';
    default: return 'Insight';
  }
}

// Utilitário para obter cor da categoria
export function getCategoryColor(category: CoachingCategory): string {
  switch (category) {
    case 'strength': return 'green';
    case 'improvement_area': return 'blue';
    case 'achievement': return 'yellow';
    case 'concern': return 'red';
    default: return 'gray';
  }
}

// Utilitário para obter label do status
export function getStatusLabel(status: InsightStatus): string {
  switch (status) {
    case 'new': return 'Novo';
    case 'acknowledged': return 'Reconhecido';
    case 'in_progress': return 'Em Andamento';
    case 'resolved': return 'Resolvido';
    default: return status;
  }
}
