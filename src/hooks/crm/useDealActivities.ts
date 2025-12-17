import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DealActivityType =
  | 'created'
  | 'updated'
  | 'stage_change'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'file_uploaded'
  | 'contact_linked'
  | 'email_sent'
  | 'call_made'
  | 'meeting_scheduled'
  | 'custom';

export type DealActivity = {
  id: string;
  deal_id: string;
  user_id: string | null;
  activity_type: DealActivityType;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type CreateActivityInput = {
  activity_type: DealActivityType;
  description: string;
  metadata?: Record<string, any>;
};

export const useDealActivities = (dealId?: string) => {
  const queryClient = useQueryClient();

  // Query para buscar atividades
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['deal-activities', dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data, error } = await supabase
        .from('deal_activities')
        .select(
          `
          *,
          profile:profiles (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as DealActivity[];
    },
    enabled: !!dealId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Agrupar atividades por data
  const groupedActivities = activities.reduce(
    (acc, activity) => {
      const date = new Date(activity.created_at).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    },
    {} as Record<string, DealActivity[]>
  );

  // Atividades recentes (últimas 24h)
  const recentActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.created_at);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return activityDate > yesterday;
  });

  // Mutation para adicionar atividade manual
  const addActivity = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      if (!dealId) {
        throw new Error('Deal ID não disponível');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          user_id: user?.id || null,
          activity_type: input.activity_type,
          description: input.description,
          metadata: input.metadata,
        })
        .select(
          `
          *,
          profile:profiles (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] });
    },
  });

  // Função para obter ícone baseado no tipo de atividade
  const getActivityIcon = (type: DealActivityType): string => {
    const icons: Record<DealActivityType, string> = {
      created: '✨',
      updated: '✏️',
      stage_change: '➡️',
      note_added: '📝',
      task_created: '✅',
      task_completed: '✓',
      file_uploaded: '📎',
      contact_linked: '👤',
      email_sent: '📧',
      call_made: '📞',
      meeting_scheduled: '📅',
      custom: '💡',
    };
    return icons[type] || '•';
  };

  // Função para obter cor baseado no tipo de atividade
  const getActivityColor = (type: DealActivityType): string => {
    const colors: Record<DealActivityType, string> = {
      created: 'text-green-600',
      updated: 'text-blue-600',
      stage_change: 'text-purple-600',
      note_added: 'text-yellow-600',
      task_created: 'text-orange-600',
      task_completed: 'text-green-600',
      file_uploaded: 'text-blue-600',
      contact_linked: 'text-indigo-600',
      email_sent: 'text-cyan-600',
      call_made: 'text-pink-600',
      meeting_scheduled: 'text-teal-600',
      custom: 'text-gray-600',
    };
    return colors[type] || 'text-gray-600';
  };

  // Função para formatar descrição com metadados
  const formatActivityDescription = (activity: DealActivity): string => {
    if (activity.description) {
      return activity.description;
    }

    // Gerar descrição baseada no tipo
    switch (activity.activity_type) {
      case 'created':
        return 'Negócio criado';
      case 'updated':
        return 'Negócio atualizado';
      case 'stage_change':
        return activity.metadata?.stage_name
          ? `Movido para "${activity.metadata.stage_name}"`
          : 'Stage alterado';
      case 'note_added':
        return 'Nota adicionada';
      case 'task_created':
        return activity.metadata?.title
          ? `Tarefa criada: ${activity.metadata.title}`
          : 'Tarefa criada';
      case 'task_completed':
        return activity.metadata?.title
          ? `Tarefa concluída: ${activity.metadata.title}`
          : 'Tarefa concluída';
      case 'file_uploaded':
        return activity.metadata?.file_name
          ? `Arquivo anexado: ${activity.metadata.file_name}`
          : 'Arquivo anexado';
      case 'contact_linked':
        return 'Contato vinculado';
      case 'email_sent':
        return 'Email enviado';
      case 'call_made':
        return 'Ligação realizada';
      case 'meeting_scheduled':
        return 'Reunião agendada';
      default:
        return 'Atividade registrada';
    }
  };

  return {
    activities,
    groupedActivities,
    recentActivities,
    isLoading,
    addActivity,
    getActivityIcon,
    getActivityColor,
    formatActivityDescription,
  };
};
