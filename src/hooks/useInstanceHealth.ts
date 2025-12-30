import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './crm/useCompanyQuery';

export interface InstanceHealth {
  id: string;
  instance_name: string;
  is_connected: boolean;
  instance_status: string | null;
  messages_sent_today: number;
  daily_message_limit: number;
  delivery_rate: number;
  response_rate: number;
  created_at: string;
  last_reset_date: string;
}

export function useInstanceHealth() {
  const { companyId } = useCompanyQuery();

  const { data: instances, isLoading, refetch } = useQuery({
    queryKey: ['instance-health', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('evolution_settings')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;

      // Mapear dados e verificar conexão baseado em is_connected OU instance_status
      return (data || []).map((instance: any) => ({
        ...instance,
        // Considera conectado se is_connected=true OU instance_status='open'/'connected'
        is_connected:
          instance.is_connected === true ||
          instance.instance_status === 'open' ||
          instance.instance_status === 'connected',
      })) as InstanceHealth[];
    },
    enabled: !!companyId,
  });

  return {
    instances: instances || [],
    isLoading,
    refetch,
  };
}
