import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  AISuggestion,
  Priority,
  SuggestionType,
  MessageForAnalysis,
} from '@/types/ai-assistant';

const normalizeAISuggestion = (s: any): AISuggestion => ({
  ...s,
  type: (s.suggestion_type || s.type || 'response') as SuggestionType,
  suggested_response: s.suggested_response || s.content || '',
});

interface UseContextualSuggestionsOptions {
  conversationId?: string;
  companyId?: string;
  enabled?: boolean;
}

export function useContextualSuggestions({
  conversationId,
  companyId,
  enabled = true,
}: UseContextualSuggestionsOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar sugestões ativas para a conversa atual
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
  } = useQuery({
    queryKey: ['ai-suggestions', conversationId],
    queryFn: async (): Promise<AISuggestion[]> => {
      if (!conversationId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('status', 'pending')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data as any) || []).map(normalizeAISuggestion);
    },
    enabled: !!conversationId && enabled,
    staleTime: 30 * 1000,
  });

  // Buscar todas as sugestões do agente (para a aba de sugestões)
  const {
    data: allSuggestions,
    isLoading: isLoadingAll,
    error: allSuggestionsError,
  } = useQuery({
    queryKey: ['ai-suggestions-all', user?.id],
    queryFn: async (): Promise<AISuggestion[]> => {
      if (!user?.id) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('ai_suggestions')
        .select(`
          *,
          conversations!inner(assigned_to)
        `)
        .eq('conversations.assigned_to', user.id)
        .eq('status', 'pending')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return ((data as any) || []).map(normalizeAISuggestion);
    },
    enabled: !!user?.id && enabled,
    staleTime: 30 * 1000,
  });

  // Buscar alertas ativos (sugestões do tipo alert)
  const alerts = allSuggestions?.filter((s) => s.type === 'alert') || [];
  const urgentAlerts = alerts.filter((s) => s.priority === 'urgent' || s.priority === 'high');

  // Mutation para marcar sugestão como usada
  const useSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ status: 'used', used_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: (_, suggestionId) => {
      // Atualizar cache localmente
      queryClient.setQueryData(
        ['ai-suggestions', conversationId],
        (old: AISuggestion[] | undefined) =>
          old?.filter((s) => s.id !== suggestionId) || []
      );
      queryClient.setQueryData(
        ['ai-suggestions-all', user?.id],
        (old: AISuggestion[] | undefined) =>
          old?.filter((s) => s.id !== suggestionId) || []
      );
    },
  });

  // Mutation para dar feedback sobre sugestão
  const feedbackMutation = useMutation({
    mutationFn: async ({
      suggestionId,
      wasUseful,
      feedback,
    }: {
      suggestionId: string;
      wasUseful: boolean;
      feedback?: string;
    }) => {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({
          status: wasUseful ? 'used' : 'dismissed',
          used_at: wasUseful ? new Date().toISOString() : null,
          dismissed_reason: wasUseful ? null : feedback,
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: (_, { suggestionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['ai-suggestions', conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['ai-suggestions-all', user?.id],
      });
    },
  });

  // Mutation para gerar novas sugestões
  const generateSuggestionsMutation = useMutation({
    mutationFn: async ({
      conversationId,
      companyId,
      messages,
      trigger,
      context,
    }: {
      conversationId: string;
      companyId: string;
      messages: MessageForAnalysis[];
      trigger: 'new_message' | 'long_wait' | 'low_quality' | 'manual';
      context?: {
        contact_info?: { name: string; company?: string };
        deal_info?: { stage: string; value?: number };
        wait_time?: number;
        quality_score?: number;
      };
    }) => {
      // Buscar chaves de API da empresa
      let geminiApiKey = '';
      let openaiApiKey = '';
      let groqApiKey = '';

      if (companyId) {
        const { data: settings } = await supabase
          .from('ai_settings')
          .select('gemini_api_key, openai_api_key, groq_api_key')
          .eq('company_id', companyId)
          .maybeSingle();

        if (settings) {
          geminiApiKey = settings.gemini_api_key || '';
          openaiApiKey = settings.openai_api_key || '';
          groqApiKey = settings.groq_api_key || '';
        }
      }

      const { data, error } = await supabase.functions.invoke('ai-generate-suggestions', {
        body: {
          conversation_id: conversationId,
          agent_id: user?.id,
          company_id: companyId,
          messages,
          trigger,
          context,
          geminiApiKey,
          openaiApiKey,
          groqApiKey,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-suggestions', conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['ai-suggestions-all', user?.id],
      });
    },
  });

  // Dismissar sugestão (marcar como não usada mas removida)
  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    const { error } = await supabase
      .from('ai_suggestions')
      .update({ status: 'dismissed' })
      .eq('id', suggestionId);

    if (!error) {
      queryClient.setQueryData(
        ['ai-suggestions', conversationId],
        (old: AISuggestion[] | undefined) =>
          old?.filter((s) => s.id !== suggestionId) || []
      );
      queryClient.setQueryData(
        ['ai-suggestions-all', user?.id],
        (old: AISuggestion[] | undefined) =>
          old?.filter((s) => s.id !== suggestionId) || []
      );
    }
  }, [conversationId, user?.id, queryClient]);

  // Real-time subscription para novas sugestões
  useEffect(() => {
    if (!user?.id) return;

    // Se tivermos companyId, filtramos por ele, senão ouvimos tudo da empresa (se o RLS permitir)
    const filter = companyId ? `company_id=eq.${companyId}` : undefined;

    const channel = supabase
      .channel(`suggestions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_suggestions',
          filter,
        },
        async (payload) => {
          const newSuggestionData = payload.new;

          // Verificar se a conversa é do agente (já que não temos agent_id na tabela)
          const { data: conv } = await supabase
            .from('conversations')
            .select('assigned_to')
            .eq('id', newSuggestionData.conversation_id)
            .maybeSingle();

          if (!conv || conv.assigned_to !== user.id) return;

          const newSuggestion = normalizeAISuggestion(newSuggestionData);

          // Atualizar sugestões da conversa específica
          if (newSuggestion.conversation_id === conversationId) {
            queryClient.setQueryData(
              ['ai-suggestions', conversationId],
              (old: AISuggestion[] | undefined) => [newSuggestion, ...(old || [])]
            );
          }

          // Atualizar lista geral
          queryClient.setQueryData(
            ['ai-suggestions-all', user.id],
            (old: AISuggestion[] | undefined) => [newSuggestion, ...(old || [])]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, conversationId, companyId, queryClient]);

  return {
    // Sugestões da conversa atual
    suggestions: suggestions || [],
    // Todas as sugestões do agente
    allSuggestions: allSuggestions || [],
    // Apenas alertas
    alerts,
    urgentAlerts,
    // Contagens
    alertCount: alerts.length,
    urgentCount: urgentAlerts.length,
    // Estados
    isLoading: isLoadingSuggestions || isLoadingAll,
    error: suggestionsError,
    // Ações
    useSuggestion: useSuggestionMutation.mutate,
    giveFeedback: feedbackMutation.mutate,
    generateSuggestions: generateSuggestionsMutation.mutate,
    dismissSuggestion,
    isGenerating: generateSuggestionsMutation.isPending,
  };
}

// Hook auxiliar para filtrar sugestões por tipo
export function useSuggestionsByType(
  suggestions: AISuggestion[],
  type?: SuggestionType,
  priority?: Priority
) {
  return suggestions.filter((s) => {
    if (type && s.type !== type) return false;
    if (priority && s.priority !== priority) return false;
    return true;
  });
}

// Utilitário para prioridade numérica (para ordenação)
export function getPriorityWeight(priority: Priority): number {
  switch (priority) {
    case 'urgent': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

// Ordenar sugestões por prioridade e data
export function sortSuggestions(suggestions: AISuggestion[]): AISuggestion[] {
  return [...suggestions].sort((a, b) => {
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
