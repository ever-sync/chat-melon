import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  AssistantSettings,
  DEFAULT_ASSISTANT_SETTINGS,
} from '@/types/ai-assistant';

export function useAssistantSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['assistant-settings', user?.id],
    queryFn: async (): Promise<AssistantSettings | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não existe, retorna null
          return null;
        }
        throw error;
      }

      return data as AssistantSettings;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const createSettingsMutation = useMutation({
    mutationFn: async (
      companyId: string
    ): Promise<AssistantSettings | null> => {
      if (!user?.id) {
        console.warn('useAssistantSettings: User not authenticated, skipping settings creation');
        return null;
      }

      const newSettings = {
        user_id: user.id,
        company_id: companyId,
        ...DEFAULT_ASSISTANT_SETTINGS,
      };

      const { data, error } = await supabase
        .from('assistant_settings')
        .insert(newSettings)
        .select()
        .single();

      if (error) {
        // Se for conflito (409), buscar settings existentes
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          const { data: existing } = await supabase
            .from('assistant_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          return existing as AssistantSettings;
        }
        console.error('Error creating assistant settings:', error);
        return null;
      }
      return data as AssistantSettings;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['assistant-settings', user?.id], data);
      }
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (
      updates: Partial<Omit<AssistantSettings, 'id' | 'user_id' | 'company_id' | 'created_at'>>
    ): Promise<AssistantSettings | null> => {
      if (!user?.id) {
        console.warn('useAssistantSettings: User not authenticated, skipping update');
        return null;
      }

      const { data, error } = await supabase
        .from('assistant_settings')
        .upsert({
          user_id: user.id,
          ...updates
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating assistant settings:', error);
        return null;
      }
      return data as AssistantSettings;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['assistant-settings', user?.id], data);
      }
    },
  });

  const ensureSettings = async (companyId: string): Promise<AssistantSettings | null> => {
    if (settings) return settings;
    return createSettingsMutation.mutateAsync(companyId);
  };

  return {
    settings,
    isLoading,
    error,
    createSettings: createSettingsMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    ensureSettings,
    isCreating: createSettingsMutation.isPending,
    isUpdating: updateSettingsMutation.isPending,
  };
}
