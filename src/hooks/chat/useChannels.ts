import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import type {
  Channel,
  ChannelType,
  ChannelStatus,
  ChannelCredentials,
  ChannelSettings,
  ChannelHealthLog,
} from '@/types/channels';

// =====================================================
// Channels Hook
// =====================================================

export const useChannels = () => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  // Fetch all channels
  const channelsQuery = useQuery({
    queryKey: ['channels', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Channel[];
    },
    enabled: !!currentCompany?.id,
  });

  // Create channel
  const createChannel = useMutation({
    mutationFn: async (params: {
      type: ChannelType;
      name: string;
      credentials: ChannelCredentials;
      settings?: ChannelSettings;
      external_id?: string;
    }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('channels')
        .insert({
          company_id: currentCompany.id,
          type: params.type,
          name: params.name,
          credentials: params.credentials,
          settings: params.settings || {},
          external_id: params.external_id,
          status: 'connecting',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar canal: ' + error.message);
    },
  });

  // Update channel
  const updateChannel = useMutation({
    mutationFn: async (params: {
      id: string;
      name?: string;
      credentials?: ChannelCredentials;
      settings?: ChannelSettings;
      status?: ChannelStatus;
      error_message?: string | null;
    }) => {
      const { id, ...updates } = params;

      const { data, error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar canal: ' + error.message);
    },
  });

  // Delete channel
  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('channels').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover canal: ' + error.message);
    },
  });

  // Connect channel (trigger connection flow)
  const connectChannel = useMutation({
    mutationFn: async (id: string) => {
      // Update status to connecting
      const { data, error } = await supabase
        .from('channels')
        .update({ status: 'connecting', error_message: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // TODO: Trigger actual connection logic based on channel type
      // This would call the appropriate OAuth flow or API validation

      return data as Channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Iniciando conexão...');
    },
    onError: (error) => {
      toast.error('Erro ao conectar: ' + error.message);
    },
  });

  // Disconnect channel
  const disconnectChannel = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('channels')
        .update({
          status: 'disconnected',
          error_message: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Canal desconectado!');
    },
    onError: (error) => {
      toast.error('Erro ao desconectar: ' + error.message);
    },
  });

  // Get channel by type
  const getChannelByType = (type: ChannelType): Channel | undefined => {
    return channelsQuery.data?.find((c) => c.type === type);
  };

  // Get connected channels
  const getConnectedChannels = (): Channel[] => {
    return channelsQuery.data?.filter((c) => c.status === 'connected') || [];
  };

  return {
    channels: channelsQuery.data || [],
    isLoading: channelsQuery.isLoading,
    isError: channelsQuery.isError,
    error: channelsQuery.error,
    createChannel,
    updateChannel,
    deleteChannel,
    connectChannel,
    disconnectChannel,
    getChannelByType,
    getConnectedChannels,
    refetch: channelsQuery.refetch,
  };
};

// =====================================================
// Channel Health Hook
// =====================================================

export const useChannelHealth = (channelId: string | null) => {
  const healthQuery = useQuery({
    queryKey: ['channel-health', channelId],
    queryFn: async () => {
      if (!channelId) return [];

      const { data, error } = await supabase
        .from('channel_health_logs')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ChannelHealthLog[];
    },
    enabled: !!channelId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate health metrics
  const getHealthMetrics = () => {
    if (!healthQuery.data?.length) return null;

    const logs = healthQuery.data;
    const last24h = logs.filter(
      (l) => new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const healthyCount = last24h.filter((l) => l.status === 'healthy').length;
    const totalCount = last24h.length;
    const uptime = totalCount > 0 ? (healthyCount / totalCount) * 100 : 100;

    const responseTimes = last24h
      .filter((l) => l.response_time_ms != null)
      .map((l) => l.response_time_ms!);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      uptime: uptime.toFixed(1),
      avgResponseTime: Math.round(avgResponseTime),
      totalChecks: totalCount,
      lastCheck: logs[0]?.created_at,
      currentStatus: logs[0]?.status || 'unknown',
    };
  };

  return {
    healthLogs: healthQuery.data || [],
    isLoading: healthQuery.isLoading,
    metrics: getHealthMetrics(),
  };
};

// =====================================================
// Single Channel Hook
// =====================================================

export const useChannel = (channelId: string | null) => {
  const queryClient = useQueryClient();

  const channelQuery = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      if (!channelId) return null;

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) throw error;
      return data as Channel;
    },
    enabled: !!channelId,
  });

  // Update channel settings
  const updateSettings = useMutation({
    mutationFn: async (settings: ChannelSettings) => {
      if (!channelId) throw new Error('No channel selected');

      const { data, error } = await supabase
        .from('channels')
        .update({ settings })
        .eq('id', channelId)
        .select()
        .single();

      if (error) throw error;
      return data as Channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Configurações salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Test channel connection
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!channelId) throw new Error('No channel selected');

      // Call Edge Function to test connection
      const { data, error } = await supabase.functions.invoke('test-channel-connection', {
        body: { channel_id: channelId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Conexão funcionando!');
      } else {
        toast.error('Falha na conexão: ' + data.error);
      }
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
    },
    onError: (error) => {
      toast.error('Erro ao testar: ' + error.message);
    },
  });

  return {
    channel: channelQuery.data,
    isLoading: channelQuery.isLoading,
    isError: channelQuery.isError,
    updateSettings,
    testConnection,
    refetch: channelQuery.refetch,
  };
};
