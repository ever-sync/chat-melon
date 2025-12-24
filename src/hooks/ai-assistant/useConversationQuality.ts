import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  ConversationQualityScore,
  QualityAnalysisResult,
  MessageForAnalysis,
} from '@/types/ai-assistant';

interface UseConversationQualityOptions {
  conversationId?: string;
  agentId?: string;
  enabled?: boolean;
}

export function useConversationQuality({
  conversationId,
  agentId,
  enabled = true,
}: UseConversationQualityOptions = {}) {
  const queryClient = useQueryClient();

  // Buscar score de qualidade da conversa específica
  const {
    data: qualityScore,
    isLoading: isLoadingScore,
    error: scoreError,
  } = useQuery({
    queryKey: ['conversation-quality', conversationId],
    queryFn: async (): Promise<ConversationQualityScore | null> => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('conversation_quality_scores')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as ConversationQualityScore;
    },
    enabled: !!conversationId && enabled,
    staleTime: 60 * 1000,
  });

  // Buscar histórico de scores do agente
  const {
    data: agentScoreHistory,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ['agent-quality-history', agentId],
    queryFn: async (): Promise<ConversationQualityScore[]> => {
      if (!agentId) return [];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('conversation_quality_scores')
        .select('*')
        .eq('agent_id', agentId)
        .gte('analyzed_at', sevenDaysAgo.toISOString())
        .order('analyzed_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ConversationQualityScore[];
    },
    enabled: !!agentId && enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Calcular médias do período
  const averageScores = agentScoreHistory && agentScoreHistory.length > 0
    ? {
        overall: agentScoreHistory.reduce((sum, s) => sum + (s.overall_score || 0), 0) / agentScoreHistory.length,
        empathy: agentScoreHistory.reduce((sum, s) => sum + (s.empathy_score || 0), 0) / agentScoreHistory.length,
        resolution: agentScoreHistory.reduce((sum, s) => sum + (s.resolution_score || 0), 0) / agentScoreHistory.length,
        tone: agentScoreHistory.reduce((sum, s) => sum + (s.tone_score || 0), 0) / agentScoreHistory.length,
        professionalism: agentScoreHistory.reduce((sum, s) => sum + (s.professionalism_score || 0), 0) / agentScoreHistory.length,
        responseQuality: agentScoreHistory.reduce((sum, s) => sum + (s.response_quality_score || 0), 0) / agentScoreHistory.length,
        count: agentScoreHistory.length,
      }
    : null;

  // Mutation para solicitar análise de qualidade
  const analyzeQualityMutation = useMutation({
    mutationFn: async ({
      conversationId,
      messages,
      agentId,
      companyId,
    }: {
      conversationId: string;
      messages: MessageForAnalysis[];
      agentId: string;
      companyId: string;
    }): Promise<QualityAnalysisResult> => {
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

      // Chamar Edge Function para análise
      const { data, error } = await supabase.functions.invoke('ai-quality-scoring', {
        body: {
          conversation_id: conversationId,
          messages,
          agent_id: agentId,
          company_id: companyId,
          geminiApiKey,
          openaiApiKey,
          groqApiKey,
        },
      });

      if (error) throw error;
      return data as QualityAnalysisResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation-quality', variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['agent-quality-history', variables.agentId],
      });
    },
  });

  // Real-time subscription para novos scores
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`quality-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_quality_scores',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            queryClient.setQueryData(
              ['conversation-quality', conversationId],
              payload.new as ConversationQualityScore
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return {
    qualityScore,
    agentScoreHistory: agentScoreHistory || [],
    averageScores,
    isLoading: isLoadingScore || isLoadingHistory,
    error: scoreError,
    analyzeQuality: analyzeQualityMutation.mutate,
    isAnalyzing: analyzeQualityMutation.isPending,
  };
}

// Hook para buscar scores mais baixos (para alertas)
export function useLowQualityConversations(companyId?: string, threshold = 70) {
  const {
    data: lowQualityConversations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['low-quality-conversations', companyId, threshold],
    queryFn: async () => {
      if (!companyId) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('conversation_quality_scores')
        .select(`
          *,
          conversation:conversations!conversation_id(
            id,
            contact:contacts!contact_id(name, phone)
          ),
          agent:profiles!agent_id(id, full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .lt('overall_score', threshold)
        .gte('analyzed_at', today.toISOString())
        .order('overall_score', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  return {
    lowQualityConversations,
    isLoading,
    error,
  };
}
