import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./crm/useCompanyQuery";

export interface InstanceHealth {
  id: string;
  instance_name: string;
  is_connected: boolean;
  messages_sent_today: number;
  daily_message_limit: number;
  delivery_rate: number;
  response_rate: number;
  created_at: string;
  last_reset_date: string;
}

export function useInstanceHealth() {
  const { companyId } = useCompanyQuery();

  const { data: instances, isLoading } = useQuery({
    queryKey: ['instance-health', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('evolution_settings')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data as InstanceHealth[];
    },
    enabled: !!companyId,
  });

  return {
    instances: instances || [],
    isLoading,
  };
}