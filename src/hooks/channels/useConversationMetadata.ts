import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  InstagramConversationMetadata,
  FacebookConversationMetadata,
  WhatsAppConversationMetadata,
  WebchatConversationMetadata,
} from '@/types/channelSettings';

type ChannelType = 'instagram' | 'facebook' | 'whatsapp' | 'webchat';

type MetadataByChannel = {
  instagram: InstagramConversationMetadata;
  facebook: FacebookConversationMetadata;
  whatsapp: WhatsAppConversationMetadata;
  webchat: WebchatConversationMetadata;
};

const tableByChannel: Record<ChannelType, string> = {
  instagram: 'instagram_conversation_metadata',
  facebook: 'facebook_conversation_metadata',
  whatsapp: 'whatsapp_conversation_metadata',
  webchat: 'webchat_conversation_metadata',
};

/**
 * Hook genérico para buscar metadados de conversa por tipo de canal
 */
export function useConversationMetadata<T extends ChannelType>(
  conversationId: string | undefined,
  channelType: T
) {
  const queryClient = useQueryClient();
  const tableName = tableByChannel[channelType];

  const {
    data: metadata,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversation-metadata', channelType, conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) throw error;
      return data as MetadataByChannel[T] | null;
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<MetadataByChannel[T]>) => {
      if (!conversationId) throw new Error('Conversation ID is required');

      // Check if metadata exists
      const existing = await supabase
        .from(tableName)
        .select('id')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (existing.data) {
        // Update
        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('conversation_id', conversationId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from(tableName)
          .insert({ ...updates, conversation_id: conversationId })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['conversation-metadata', channelType, conversationId], data);
    },
  });

  return {
    metadata,
    isLoading,
    error,
    refetch,
    updateMetadata: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Hook específico para metadados do Instagram
 */
export function useInstagramMetadata(conversationId: string | undefined) {
  return useConversationMetadata(conversationId, 'instagram');
}

/**
 * Hook específico para metadados do Facebook
 */
export function useFacebookMetadata(conversationId: string | undefined) {
  return useConversationMetadata(conversationId, 'facebook');
}

/**
 * Hook específico para metadados do WhatsApp
 */
export function useWhatsAppMetadata(conversationId: string | undefined) {
  return useConversationMetadata(conversationId, 'whatsapp');
}

/**
 * Hook específico para metadados do WebChat
 */
export function useWebchatMetadata(conversationId: string | undefined) {
  return useConversationMetadata(conversationId, 'webchat');
}

/**
 * Hook para incrementar contadores de mensagens
 */
export function useIncrementMessageCount(
  conversationId: string | undefined,
  channelType: ChannelType
) {
  const queryClient = useQueryClient();
  const tableName = tableByChannel[channelType];

  return useMutation({
    mutationFn: async ({ direction }: { direction: 'received' | 'sent' }) => {
      if (!conversationId) throw new Error('Conversation ID is required');

      const field = direction === 'received' ? 'messages_received' : 'messages_sent';

      // Use RPC or raw SQL to increment
      const { data: existing } = await supabase
        .from(tableName)
        .select('id, messages_received, messages_sent')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (existing) {
        const newCount = (existing[field] || 0) + 1;
        const { error } = await supabase
          .from(tableName)
          .update({ [field]: newCount })
          .eq('conversation_id', conversationId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert({
          conversation_id: conversationId,
          [field]: 1,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['conversation-metadata', channelType, conversationId],
      });
    },
  });
}
