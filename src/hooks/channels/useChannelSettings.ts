import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChannelSettings, ChannelSettingsUpdate } from '@/types/channelSettings';

/**
 * Hook para gerenciar configurações de um canal específico
 */
export function useChannelSettings(channelId: string | undefined) {
  const queryClient = useQueryClient();

  // Buscar configurações do canal
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['channel-settings', channelId],
    queryFn: async () => {
      if (!channelId) return null;

      const { data, error } = await supabase
        .from('channel_settings')
        .select('*')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (error) throw error;
      return data as ChannelSettings | null;
    },
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Atualizar configurações
  const updateMutation = useMutation({
    mutationFn: async (updates: ChannelSettingsUpdate) => {
      if (!channelId) throw new Error('Channel ID is required');

      const { data, error } = await supabase
        .from('channel_settings')
        .update(updates)
        .eq('channel_id', channelId)
        .select()
        .single();

      if (error) throw error;
      return data as ChannelSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['channel-settings', channelId], data);
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  // Ativar/desativar bot
  const toggleBot = async (enabled: boolean) => {
    return updateMutation.mutateAsync({ bot_enabled: enabled });
  };

  // Ativar/desativar IA
  const toggleAI = async (enabled: boolean) => {
    return updateMutation.mutateAsync({ ai_enabled: enabled });
  };

  // Ativar/desativar horário de atendimento
  const toggleBusinessHours = async (enabled: boolean) => {
    return updateMutation.mutateAsync({ business_hours_enabled: enabled });
  };

  // Ativar/desativar atribuição automática
  const toggleAutoAssign = async (enabled: boolean) => {
    return updateMutation.mutateAsync({ auto_assign_enabled: enabled });
  };

  // Verificar se está dentro do horário de atendimento
  const isWithinBusinessHours = (): boolean => {
    if (!settings?.business_hours_enabled) return true;

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDay = dayNames[now.getDay()];
    const daySettings = settings.business_hours[currentDay];

    if (!daySettings.enabled || !daySettings.start || !daySettings.end) return false;

    const currentTime = now.toTimeString().slice(0, 5); // HH:mm
    return currentTime >= daySettings.start && currentTime <= daySettings.end;
  };

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleBot,
    toggleAI,
    toggleBusinessHours,
    toggleAutoAssign,
    isWithinBusinessHours,
  };
}

/**
 * Hook para listar configurações de todos os canais de uma empresa
 */
export function useCompanyChannelSettings(companyId: string | undefined) {
  return useQuery({
    queryKey: ['company-channel-settings', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('channel_settings')
        .select(`
          *,
          channels:channel_id (
            id,
            name,
            type,
            status
          )
        `)
        .eq('company_id', companyId);

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para configurações de IA de um canal
 */
export function useChannelAISettings(channelId: string | undefined) {
  const { settings, updateSettings, isUpdating } = useChannelSettings(channelId);

  const aiSettings = settings
    ? {
        enabled: settings.ai_enabled,
        model: settings.ai_model,
        temperature: settings.ai_temperature,
        maxTokens: settings.ai_max_tokens,
        systemPrompt: settings.ai_system_prompt,
        autoRespond: settings.ai_auto_respond,
        suggestResponses: settings.ai_suggest_responses,
        autoCategorize: settings.ai_auto_categorize,
        sentimentAnalysis: settings.ai_sentiment_analysis,
      }
    : null;

  const updateAISettings = async (updates: {
    enabled?: boolean;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string | null;
    autoRespond?: boolean;
    suggestResponses?: boolean;
    autoCategorize?: boolean;
    sentimentAnalysis?: boolean;
  }) => {
    const mappedUpdates: ChannelSettingsUpdate = {};

    if (updates.enabled !== undefined) mappedUpdates.ai_enabled = updates.enabled;
    if (updates.model !== undefined) mappedUpdates.ai_model = updates.model;
    if (updates.temperature !== undefined) mappedUpdates.ai_temperature = updates.temperature;
    if (updates.maxTokens !== undefined) mappedUpdates.ai_max_tokens = updates.maxTokens;
    if (updates.systemPrompt !== undefined) mappedUpdates.ai_system_prompt = updates.systemPrompt;
    if (updates.autoRespond !== undefined) mappedUpdates.ai_auto_respond = updates.autoRespond;
    if (updates.suggestResponses !== undefined) mappedUpdates.ai_suggest_responses = updates.suggestResponses;
    if (updates.autoCategorize !== undefined) mappedUpdates.ai_auto_categorize = updates.autoCategorize;
    if (updates.sentimentAnalysis !== undefined) mappedUpdates.ai_sentiment_analysis = updates.sentimentAnalysis;

    return updateSettings(mappedUpdates);
  };

  return {
    aiSettings,
    updateAISettings,
    isUpdating,
  };
}

/**
 * Hook para configurações de Bot de um canal
 */
export function useChannelBotSettings(channelId: string | undefined) {
  const { settings, updateSettings, isUpdating } = useChannelSettings(channelId);

  const botSettings = settings
    ? {
        enabled: settings.bot_enabled,
        botId: settings.bot_id,
        welcomeMessage: settings.bot_welcome_message,
        fallbackMessage: settings.bot_fallback_message,
        transferKeywords: settings.bot_transfer_to_human_keywords,
      }
    : null;

  const updateBotSettings = async (updates: {
    enabled?: boolean;
    botId?: string | null;
    welcomeMessage?: string | null;
    fallbackMessage?: string;
    transferKeywords?: string[];
  }) => {
    const mappedUpdates: ChannelSettingsUpdate = {};

    if (updates.enabled !== undefined) mappedUpdates.bot_enabled = updates.enabled;
    if (updates.botId !== undefined) mappedUpdates.bot_id = updates.botId;
    if (updates.welcomeMessage !== undefined) mappedUpdates.bot_welcome_message = updates.welcomeMessage;
    if (updates.fallbackMessage !== undefined) mappedUpdates.bot_fallback_message = updates.fallbackMessage;
    if (updates.transferKeywords !== undefined) mappedUpdates.bot_transfer_to_human_keywords = updates.transferKeywords;

    return updateSettings(mappedUpdates);
  };

  return {
    botSettings,
    updateBotSettings,
    isUpdating,
  };
}
