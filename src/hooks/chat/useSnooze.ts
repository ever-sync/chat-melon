import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { toast } from 'sonner';
import { addMinutes, addHours, addDays, setHours, setMinutes, nextMonday } from 'date-fns';

export interface SnoozeOption {
  id: string;
  label: string;
  getDate: () => Date;
}

export const SNOOZE_OPTIONS: SnoozeOption[] = [
  {
    id: '30min',
    label: '30 minutos',
    getDate: () => addMinutes(new Date(), 30),
  },
  {
    id: '1hour',
    label: '1 hora',
    getDate: () => addHours(new Date(), 1),
  },
  {
    id: '2hours',
    label: '2 horas',
    getDate: () => addHours(new Date(), 2),
  },
  {
    id: '4hours',
    label: '4 horas',
    getDate: () => addHours(new Date(), 4),
  },
  {
    id: 'tomorrow9am',
    label: 'Amanhã às 9h',
    getDate: () => {
      const tomorrow = addDays(new Date(), 1);
      return setMinutes(setHours(tomorrow, 9), 0);
    },
  },
  {
    id: 'nextmonday9am',
    label: 'Segunda às 9h',
    getDate: () => {
      const monday = nextMonday(new Date());
      return setMinutes(setHours(monday, 9), 0);
    },
  },
];

interface SnoozedConversation {
  id: string;
  contact_name: string;
  contact_number: string;
  snoozed_until: string;
  snooze_reason?: string;
  snoozed_by: string;
}

export const useSnooze = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  // Get snoozed conversations count
  const { data: snoozedCount = 0 } = useQuery({
    queryKey: ['snoozed-count', companyId],
    queryFn: async () => {
      if (!companyId) return 0;

      const { count, error } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .not('snoozed_until', 'is', null)
        .gt('snoozed_until', new Date().toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Get snoozed conversations list
  const { data: snoozedConversations = [], isLoading: isLoadingSnoozed } = useQuery({
    queryKey: ['snoozed-conversations', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          contact_name,
          contact_number,
          snoozed_until,
          snooze_reason,
          snoozed_by
        `
        )
        .eq('company_id', companyId)
        .not('snoozed_until', 'is', null)
        .gt('snoozed_until', new Date().toISOString())
        .order('snoozed_until', { ascending: true });

      if (error) throw error;
      return data as SnoozedConversation[];
    },
    enabled: !!companyId,
    refetchInterval: 60000,
  });

  // Snooze a conversation
  const snooze = useMutation({
    mutationFn: async ({
      conversationId,
      until,
      reason,
    }: {
      conversationId: string;
      until: Date;
      reason?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('conversations')
        .update({
          snoozed_until: until.toISOString(),
          snoozed_by: user.user.id,
          snooze_reason: reason || null,
          snoozed_at: new Date().toISOString(),
          status: 'waiting',
          assigned_to: null,
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      // Create history record
      await supabase.from('conversation_snooze_history').insert({
        conversation_id: conversationId,
        company_id: companyId,
        snoozed_by: user.user.id,
        snoozed_until: until.toISOString(),
        reason: reason || null,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['snoozed-count'] });
      queryClient.invalidateQueries({ queryKey: ['snoozed-conversations'] });
      toast.success('Conversa adiada!', {
        description: 'A conversa reaparecerá no horário programado.',
      });
    },
    onError: (error) => {
      toast.error('Erro ao adiar conversa: ' + error.message);
    },
  });

  // Unsnooze a conversation
  const unsnooze = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('conversations')
        .update({
          snoozed_until: null,
          snoozed_by: null,
          snooze_reason: null,
          snoozed_at: null,
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      // Update history record
      await supabase
        .from('conversation_snooze_history')
        .update({
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.user.id,
        })
        .eq('conversation_id', conversationId)
        .is('cancelled_at', null)
        .is('expired_at', null);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['snoozed-count'] });
      queryClient.invalidateQueries({ queryKey: ['snoozed-conversations'] });
      toast.success('Conversa reativada!');
    },
    onError: (error) => {
      toast.error('Erro ao reativar conversa: ' + error.message);
    },
  });

  // Check if a conversation is snoozed
  const isSnoozed = (conversation: { snoozed_until?: string | null }): boolean => {
    if (!conversation.snoozed_until) return false;
    return new Date(conversation.snoozed_until) > new Date();
  };

  return {
    snoozedCount,
    snoozedConversations,
    isLoadingSnoozed,
    snooze,
    unsnooze,
    isSnoozed,
    snoozeOptions: SNOOZE_OPTIONS,
  };
};
