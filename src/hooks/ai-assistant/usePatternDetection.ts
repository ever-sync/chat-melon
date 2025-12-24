import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DetectedPattern,
  PatternType,
  ImpactLevel,
} from '@/types/ai-assistant';

interface UsePatternDetectionOptions {
  companyId?: string;
  agentId?: string;
  enabled?: boolean;
}

export function usePatternDetection({
  companyId,
  agentId,
  enabled = true,
}: UsePatternDetectionOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetAgentId = agentId || user?.id;

  // Buscar padrões detectados
  const {
    data: patterns,
    isLoading: isLoadingPatterns,
    error: patternsError,
  } = useQuery({
    queryKey: ['detected-patterns', companyId, targetAgentId],
    queryFn: async (): Promise<DetectedPattern[]> => {
      if (!companyId) return [];

      let query = supabase
        .from('detected_patterns')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .eq('is_resolved', false)
        .order('impact_level', { ascending: false })
        .order('created_at', { ascending: false });

      // Se for agente específico, filtrar
      if (targetAgentId && !agentId) {
        query = query.or(`agent_id.eq.${targetAgentId},agent_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as DetectedPattern[];
    },
    enabled: !!companyId && enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  // Buscar padrões por tipo
  const patternsByType = {
    recurring_issue: patterns?.filter((p) => p.pattern_type === 'recurring_issue') || [],
    success_pattern: patterns?.filter((p) => p.pattern_type === 'success_pattern') || [],
    bottleneck: patterns?.filter((p) => p.pattern_type === 'bottleneck') || [],
    performance_trend: patterns?.filter((p) => p.pattern_type === 'performance_trend') || [],
  };

  // Buscar padrões de alto impacto
  const highImpactPatterns = patterns?.filter((p) => p.impact_level === 'high') || [];

  // Mutation para marcar padrão como resolvido
  const resolvePatternMutation = useMutation({
    mutationFn: async (patternId: string) => {
      const { error } = await supabase
        .from('detected_patterns')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', patternId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['detected-patterns', companyId],
      });
    },
  });

  // Mutation para atualizar ocorrências de um padrão
  const updatePatternMutation = useMutation({
    mutationFn: async ({
      patternId,
      updates,
    }: {
      patternId: string;
      updates: Partial<Pick<DetectedPattern, 'occurrences' | 'confidence_score' | 'recommended_actions'>>;
    }) => {
      const { error } = await supabase
        .from('detected_patterns')
        .update({
          ...updates,
          last_updated: new Date().toISOString(),
        })
        .eq('id', patternId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['detected-patterns', companyId],
      });
    },
  });

  // Real-time subscription para novos padrões
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`patterns-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'detected_patterns',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['detected-patterns', companyId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, queryClient]);

  return {
    patterns: patterns || [],
    patternsByType,
    highImpactPatterns,
    isLoading: isLoadingPatterns,
    error: patternsError,
    resolvePattern: resolvePatternMutation.mutate,
    updatePattern: updatePatternMutation.mutate,
    isResolving: resolvePatternMutation.isPending,
  };
}

// Hook para buscar padrões de sucesso (para compartilhar com equipe)
export function useSuccessPatterns(companyId?: string) {
  const {
    data: successPatterns,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['success-patterns', companyId],
    queryFn: async (): Promise<DetectedPattern[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('detected_patterns')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .eq('pattern_type', 'success_pattern')
        .eq('is_resolved', false)
        .gte('confidence_score', 70)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as DetectedPattern[];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    successPatterns: successPatterns || [],
    isLoading,
    error,
  };
}

// Hook para buscar gargalos (bottlenecks)
export function useBottlenecks(companyId?: string) {
  const {
    data: bottlenecks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bottlenecks', companyId],
    queryFn: async (): Promise<DetectedPattern[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('detected_patterns')
        .select(`
          *,
          agent:profiles!agent_id(id, full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .eq('pattern_type', 'bottleneck')
        .eq('is_resolved', false)
        .order('impact_level', { ascending: false })
        .order('occurrences', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as DetectedPattern[];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    bottlenecks: bottlenecks || [],
    isLoading,
    error,
  };
}

// Utilitário para obter ícone do tipo de padrão
export function getPatternTypeIcon(type: PatternType): string {
  switch (type) {
    case 'recurring_issue': return '🔄';
    case 'success_pattern': return '🌟';
    case 'bottleneck': return '⚠️';
    case 'performance_trend': return '📈';
    default: return '📊';
  }
}

// Utilitário para obter label do tipo de padrão
export function getPatternTypeLabel(type: PatternType): string {
  switch (type) {
    case 'recurring_issue': return 'Problema Recorrente';
    case 'success_pattern': return 'Padrão de Sucesso';
    case 'bottleneck': return 'Gargalo';
    case 'performance_trend': return 'Tendência de Performance';
    default: return 'Padrão';
  }
}

// Utilitário para obter cor do impacto
export function getImpactColor(impact: ImpactLevel | null): string {
  switch (impact) {
    case 'high': return 'red';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}
