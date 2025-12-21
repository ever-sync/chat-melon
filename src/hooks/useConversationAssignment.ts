import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useConversationAssignment = (conversationId?: string) => {
  const queryClient = useQueryClient();

  // Atribuir conversa a um atendente
  const assignConversation = useMutation({
    mutationFn: async (assignedTo: string) => {
      if (!conversationId) {
        throw new Error('ID da conversa não disponível');
      }

      const { data, error } = await supabase.rpc('assign_conversation_to_agent', {
        p_conversation_id: conversationId,
        p_assigned_to: assignedTo,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      toast.success('Conversa atribuída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atribuir conversa: ' + error.message);
    },
  });

  // Marcar conversa como resolvida
  const resolveConversation = useMutation({
    mutationFn: async () => {
      if (!conversationId) {
        throw new Error('ID da conversa não disponível');
      }

      const { data, error } = await supabase.rpc('mark_conversation_resolved', {
        p_conversation_id: conversationId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      toast.success('Conversa marcada como resolvida!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao resolver conversa: ' + error.message);
    },
  });

  // Reabrir conversa
  const reopenConversation = useMutation({
    mutationFn: async () => {
      if (!conversationId) {
        throw new Error('ID da conversa não disponível');
      }

      const { data, error } = await supabase.rpc('reopen_closed_conversation', {
        p_conversation_id: conversationId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      toast.success('Conversa reaberta!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao reabrir conversa: ' + error.message);
    },
  });

  return {
    assignConversation,
    resolveConversation,
    reopenConversation,
  };
};
