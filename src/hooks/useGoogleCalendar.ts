import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export const useGoogleCalendar = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  // Verifica status de conexão ISOLADO POR EMPRESA
  const { data: connectionStatus, isLoading: isCheckingConnection } = useQuery({
    queryKey: ['google-calendar-connection', currentCompany?.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany?.id) return { connected: false };

      // Buscar token na nova tabela google_calendar_tokens (isolado por empresa)
      const { data: token } = await supabase
        .from('google_calendar_tokens')
        .select('google_email, connected_at')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .maybeSingle();

      console.log('🔍 Google Calendar status:', {
        userId: user.id,
        companyId: currentCompany.id,
        connected: !!token,
        email: token?.google_email,
      });

      return {
        connected: !!token,
        email: token?.google_email || null,
      };
    },
    enabled: !!currentCompany?.id,
  });

  // Conectar ao Google Calendar
  const connectCalendar = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany?.id) throw new Error('Not authenticated or no company selected');

      console.log('📅 Connecting Google Calendar:', {
        userId: user.id,
        companyId: currentCompany.id,
      });

      // Pede URL de autorização COM company_id
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: {
          action: 'get_auth_url',
          userId: user.id,
          companyId: currentCompany.id, // 👈 IMPORTANTE: Passar company_id
        },
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

            // Aguarda um pouco e verifica se conectou na empresa atual
            setTimeout(async () => {
              const { data: token } = await supabase
                .from('google_calendar_tokens')
                .select('id')
                .eq('user_id', user.id)
                .eq('company_id', currentCompany.id)
                .maybeSingle();

              if (token) {
                console.log('✅ Google Calendar conectado com sucesso para empresa:', currentCompany.id);
                resolve(true);
              } else {
                console.log('❌ Conexão cancelada ou falhou');
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
      if (!user || !currentCompany?.id) throw new Error('Not authenticated or no company selected');

      console.log('🔌 Disconnecting Google Calendar:', {
        userId: user.id,
        companyId: currentCompany.id,
      });

      const { error } = await supabase.functions.invoke('google-calendar-oauth', {
        body: {
          action: 'disconnect',
          userId: user.id,
          companyId: currentCompany.id, // 👈 IMPORTANTE: Passar company_id
        },
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
    mutationFn: async ({ taskId, companyId, assignedTo }: { taskId: string; companyId: string, assignedTo?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const targetUserId = assignedTo || user.id;

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'create_event',
          taskId,
          userId: targetUserId, // Use targetUserId explicitly
          companyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Evento adicionado ao Google Calendar!');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
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
      assignedTo
    }: {
      taskId: string;
      userId?: string;
      companyId: string;
      assignedTo?: string;
    }) => {
      // Prioritize assignedTo if provided, otherwise fallback to userId (legacy) or throw
      const targetUserId = assignedTo || userId;
        if (!targetUserId) throw new Error('User ID or Assigned To is required');

      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'update_event',
          taskId,
          userId: targetUserId,
          companyId,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
  });

  // Deletar evento
  const deleteCalendarEvent = useMutation({
    mutationFn: async ({
      taskId,
      userId,
      companyId,
      assignedTo
    }: {
      taskId: string;
      userId?: string;
      companyId: string;
      assignedTo?: string;
    }) => {
       // Prioritize assignedTo if provided, otherwise fallback to userId (legacy) or throw
       const targetUserId = assignedTo || userId;
       if (!targetUserId) throw new Error('User ID or Assigned To is required');

      const { error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'delete_event',
          taskId,
          userId: targetUserId,
          companyId,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
  });

  // Listar eventos do mês ISOLADO POR EMPRESA
  const { data: todayEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['google-calendar-events', currentCompany?.id],  // 👈 Adicionar companyId na key
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany?.id) return [];

      console.log('📅 Buscando eventos do Google Calendar:', {
        userId: user.id,
        companyId: currentCompany.id,
      });

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'list_month_events',
          userId: user.id,
          companyId: currentCompany.id,  // 👈 IMPORTANTE: Passar companyId
        },
      });

      if (error) throw error;

      console.log('✅ Eventos recebidos:', data.events?.length || 0);
      return data.events || [];
    },
    enabled: connectionStatus?.connected && !!currentCompany?.id,
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
  });

  // Atualizar evento do Google Calendar
  const updateGoogleEvent = useMutation({
    mutationFn: async ({ eventId, event }: { eventId: string; event: any }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany?.id) throw new Error('Not authenticated or no company');

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'update_google_event',
          userId: user.id,
          companyId: currentCompany.id,
          event: {
            eventId,
            ...event,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.meetLink) {
        toast.success(
          `Evento atualizado! Link do Meet: ${data.meetLink}`,
          { duration: 5000 }
        );
      } else {
        toast.success('Evento do Google Calendar atualizado!');
      }
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar evento: ' + error.message);
    },
  });

  // Deletar evento do Google Calendar
  const deleteGoogleEvent = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany?.id) throw new Error('Not authenticated or no company');

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'delete_google_event',
          userId: user.id,
          companyId: currentCompany.id,
          event: { eventId },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Evento do Google Calendar excluído!');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir evento: ' + error.message);
    },
  });

  // Verificar disponibilidade
  const checkAvailability = async (date: Date) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !currentCompany?.id) throw new Error('Not authenticated or no company');

    const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
      body: {
        action: 'check_availability',
        userId: user.id,
        companyId: currentCompany.id,
        event: { date: date.toISOString() },
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
    updateGoogleEvent,
    deleteGoogleEvent,
    todayEvents,
    isLoadingEvents,
    checkAvailability,
  };
};
