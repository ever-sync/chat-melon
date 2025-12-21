import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Tabulation {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TabulationInsert {
  name: string;
  description?: string | null;
  color?: string;
  company_id: string;
}

export const useTabulations = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Query para buscar todas as tabulações ativas
  const { data: tabulations = [], isLoading } = useQuery({
    queryKey: ['tabulations', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('tabulations')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Tabulation[];
    },
    enabled: !!companyId,
  });

  // Mutation para criar tabulação
  const createTabulation = useMutation({
    mutationFn: async (data: TabulationInsert) => {
      const { data: newTabulation, error } = await supabase
        .from('tabulations')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newTabulation as Tabulation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabulations', companyId] });
      toast.success('Tabulação criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar tabulação:', error);
      toast.error('Erro ao criar tabulação');
    },
  });

  // Mutation para atualizar tabulação
  const updateTabulation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TabulationInsert>;
    }) => {
      const { data: updatedTabulation, error } = await supabase
        .from('tabulations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedTabulation as Tabulation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabulations', companyId] });
      toast.success('Tabulação atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar tabulação:', error);
      toast.error('Erro ao atualizar tabulação');
    },
  });

  // Mutation para deletar tabulação (soft delete)
  const deleteTabulation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tabulations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabulations', companyId] });
      toast.success('Tabulação removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao remover tabulação:', error);
      toast.error('Erro ao remover tabulação');
    },
  });

  return {
    tabulations,
    isLoading,
    createTabulation,
    updateTabulation,
    deleteTabulation,
  };
};
