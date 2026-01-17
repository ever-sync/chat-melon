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
    onMutate: async (assignedTo) => {
      // Cancelar refetches para não sobrescrever o estado otimista
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] });

      // Snapshot do estado anterior
      const previousConversations = queryClient.getQueryData(['conversations']);
      const previousConversation = queryClient.getQueryData(['conversation', conversationId]);
      const previousCounts = queryClient.getQueryData(['conversation-counts']);

      // Atualizar otimisticamente a lista de conversas
      queryClient.setQueriesData({ queryKey: ['conversations'] }, (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((conv: any) =>
            conv.id === conversationId
              ? { ...conv, assigned_to: assignedTo, status: 'active' }
              : conv
          ),
        };
      });

      // Atualizar otimisticamente os contadores
      queryClient.setQueriesData({ queryKey: ['conversation-counts'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          aguardando: Math.max(0, (old.aguardando || 0) - 1),
          unassigned: Math.max(0, (old.unassigned || 0) - 1),
          atendimento: (old.atendimento || 0) + 1,
          mine: (old.mine || 0) + 1,
        };
      });

      // Atualizar otimisticamente a conversa individual
      queryClient.setQueryData(['conversation', conversationId], (old: any) => {
        if (!old) return old;
        return { ...old, assigned_to: assignedTo, status: 'active' };
      });

      return { previousConversations, previousConversation, previousCounts };
    },
    onError: (error: Error, _variables, context) => {
      // Reverter se der erro
      if (context?.previousConversations) {
        queryClient.setQueriesData({ queryKey: ['conversations'] }, context.previousConversations);
      }
      if (context?.previousConversation) {
        queryClient.setQueryData(['conversation', conversationId], context.previousConversation);
      }
      if (context?.previousCounts) {
        queryClient.setQueriesData({ queryKey: ['conversation-counts'] }, context.previousCounts);
      }
      toast.error('Erro ao atribuir conversa: ' + error.message);
    },
    onSettled: () => {
      // Invalidar para garantir sincronia com o banco
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation-counts'] });
    },
    onSuccess: () => {
      toast.success('Conversa atribuída com sucesso!');
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
