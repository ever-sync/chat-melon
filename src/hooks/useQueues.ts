import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './crm/useCompanyQuery';
import { toast } from 'sonner';

export interface Queue {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  color: string;
  max_conversations_per_agent: number;
  auto_assign: boolean;
  assignment_method: string;
  working_hours: any;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface QueueMember {
  id: string;
  queue_id: string;
  user_id: string;
  is_active: boolean;
  max_conversations: number | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const useQueues = () => {
  const { getCompanyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: queues, isLoading } = useQuery({
    queryKey: ['queues', getCompanyId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('company_id', getCompanyId())
        .order('display_order');

      if (error) throw error;
      return data as Queue[];
    },
    enabled: !!getCompanyId(),
  });

  const createQueue = useMutation({
    mutationFn: async (queue: Partial<Queue> & { name: string }) => {
      const { data, error } = await supabase
        .from('queues')
        .insert([
          {
            name: queue.name,
            description: queue.description,
            color: queue.color || '#3B82F6',
            max_conversations_per_agent: queue.max_conversations_per_agent || 5,
            auto_assign: queue.auto_assign !== undefined ? queue.auto_assign : true,
            assignment_method: queue.assignment_method || 'round_robin',
            working_hours: queue.working_hours,
            is_active: queue.is_active !== undefined ? queue.is_active : true,
            display_order: queue.display_order || 0,
            company_id: getCompanyId(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Fila criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar fila: ${error.message}`);
    },
  });

  const updateQueue = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Queue> & { id: string }) => {
      const { data, error } = await supabase
        .from('queues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Fila atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar fila: ${error.message}`);
    },
  });

  const deleteQueue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('queues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Fila excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir fila: ${error.message}`);
    },
  });

  return {
    queues,
    isLoading,
    createQueue: createQueue.mutateAsync,
    updateQueue: updateQueue.mutateAsync,
    deleteQueue: deleteQueue.mutateAsync,
  };
};

export const useQueueMembers = (queueId?: string) => {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['queue-members', queueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_members')
        .select('*, profiles(id, full_name, avatar_url)')
        .eq('queue_id', queueId!);

      if (error) throw error;
      return data as QueueMember[];
    },
    enabled: !!queueId,
  });

  const addMember = useMutation({
    mutationFn: async (member: {
      queue_id: string;
      user_id: string;
      is_active?: boolean;
      max_conversations?: number | null;
    }) => {
      const { data, error } = await supabase
        .from('queue_members')
        .insert([
          {
            queue_id: member.queue_id,
            user_id: member.user_id,
            is_active: member.is_active !== undefined ? member.is_active : true,
            max_conversations: member.max_conversations,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-members'] });
      toast.success('Membro adicionado à fila!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Este usuário já está nesta fila!');
      } else {
        toast.error(`Erro ao adicionar membro: ${error.message}`);
      }
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QueueMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('queue_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-members'] });
      toast.success('Membro atualizado!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar membro: ${error.message}`);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('queue_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-members'] });
      toast.success('Membro removido da fila!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover membro: ${error.message}`);
    },
  });

  return {
    members,
    isLoading,
    addMember: addMember.mutateAsync,
    updateMember: updateMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
  };
};
