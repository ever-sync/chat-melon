import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LossReason = {
  id: string;
  reason: string;
  category: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
};

export const useLossReasons = () => {
  // Query para buscar motivos de perda
  const { data: lossReasons = [], isLoading } = useQuery({
    queryKey: ['loss-reasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loss_reasons')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as LossReason[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - dados raramente mudam
  });

  // Agrupar por categoria
  const groupedByCategory = lossReasons.reduce(
    (acc, reason) => {
      const category = reason.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(reason);
      return acc;
    },
    {} as Record<string, LossReason[]>
  );

  // Categorias traduzidas
  const categoryLabels: Record<string, string> = {
    price: 'Preço',
    competition: 'Concorrência',
    budget: 'Orçamento',
    timing: 'Timing',
    unresponsive: 'Sem resposta',
    no_need: 'Sem necessidade',
    product: 'Produto',
    client_internal: 'Problemas do cliente',
    lost_interest: 'Perdeu interesse',
    other: 'Outros',
  };

  return {
    lossReasons,
    groupedByCategory,
    categoryLabels,
    isLoading,
  };
};
