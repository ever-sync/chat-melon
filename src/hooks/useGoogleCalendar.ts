import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGoogleCalendar = () => {
  const queryClient = useQueryClient();

  // Verifica status de conexão
  const { data: connectionStatus, isLoading: isCheckingConnection } = useQuery({
    queryKey: ['google-calendar-connection'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { connected: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_connected, google_calendar_email')
        .eq('id', user.id)
        .single();

      return {
        connected: profile?.google_calendar_connected || false,
        email: profile?.google_calendar_email || null,
      };
    },
  });

  // Conectar ao Google Calendar
  const connectCalendar = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Pede URL de autorização
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { action: 'get_auth_url', userId: user.id },
      });

      if (error) throw error;

      // Abre popup para OAuth
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.authUrl,
        'Google Calendar OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Monitora quando popup fecha
      return new Promise((resolve, reject) => {
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);

            // Verifica se conectou
            queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });

            // Aguarda um pouco e verifica
            setTimeout(async () => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('google_calendar_connected')
                .eq('id', user.id)
                .single();

              if (profile?.google_calendar_connected) {
                resolve(true);
              } else {
                reject(new Error('Conexão cancelada'));
              }
            }, 1000);
          }
        }, 500);

        // Timeout após 5 minutos
        setTimeout(
          () => {
            clearInterval(checkPopup);
            popup?.close();
            reject(new Error('Timeout'));
          },
          5 * 60 * 1000
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast.success('Google Calendar conectado com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message !== 'Conexão cancelada') {
        toast.error('Erro ao conectar: ' + error.message);
      }
    },
  });

  // Desconectar do Google Calendar
  const disconnectCalendar = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: { action: 'disconnect', userId: user.id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast.success('Google Calendar desconectado');
    },
    onError: (error) => {
      toast.error('Erro ao desconectar: ' + error.message);
    },
  });

  // Criar evento no Calendar
  const createCalendarEvent = useMutation({
    mutationFn: async ({ taskId, companyId }: { taskId: string; companyId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create_event',
          taskId,
          userId: user.id,
          companyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Evento adicionado ao Google Calendar!');
      queryClient.invalidateQueries({ queryKey: ['calendar-sync'] });
    },
    onError: (error) => {
      toast.error('Erro ao criar evento: ' + error.message);
    },
  });

  // Atualizar evento
  const updateCalendarEvent = useMutation({
    mutationFn: async ({
      taskId,
      userId,
      companyId,
    }: {
      taskId: string;
      userId: string;
      companyId: string;
    }) => {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'update_event',
          taskId,
          userId,
          companyId,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-sync'] });
    },
  });

  // Deletar evento
  const deleteCalendarEvent = useMutation({
    mutationFn: async ({
      taskId,
      userId,
      companyId,
    }: {
      taskId: string;
      userId: string;
      companyId: string;
    }) => {
      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'delete_event',
          taskId,
          userId,
          companyId,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-sync'] });
    },
  });

  // Listar eventos do mês
  const { data: todayEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['google-calendar-events'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'list_month_events', userId: user.id },
      });

      if (error) throw error;
      return data.events || [];
    },
    enabled: connectionStatus?.connected,
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  // Verificar disponibilidade
  const checkAvailability = async (date: Date) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
      body: {
        action: 'check_availability',
        userId: user.id,
        date: date.toISOString(),
      },
    });

    if (error) throw error;
    return data.slots || [];
  };

  return {
    connectionStatus,
    isCheckingConnection,
    connectCalendar,
    disconnectCalendar,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    todayEvents,
    isLoadingEvents,
    checkAvailability,
  };
};
