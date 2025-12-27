import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { executeAutomations, type AutomationRule } from '@/lib/automations';
import { usePaginatedQuery } from '@/hooks/ui/usePaginatedQuery';
import { PAGINATION } from '@/config/constants';

export type Deal = Tables<'deals'> & {
  contacts: Tables<'contacts'> | null;
  pipeline_stages: Tables<'pipeline_stages'> | null;
  profiles: Tables<'profiles'> | null;
};

export interface DealFilters {
  search?: string;
  assignedTo?: string;
  priority?: string;
  temperature?: string;
}

export const useDeals = (
  pipelineId?: string,
  contactId?: string,
  filters?: DealFilters,
  options?: { page?: number; pageSize?: number }
) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const dealsQuery = usePaginatedQuery<Deal>({
    queryKey: ['deals', companyId, pipelineId, contactId, filters],
    queryFn: async ({ page, limit, offset }) => {
      if (!companyId) {
        return { data: [], count: 0 };
      }

      let query = supabase
        .from('deals')
        .select(
          `
          *,
          contacts (*),
          pipeline_stages (*),
          profiles!assigned_to (*)
        `,
          { count: 'exact' }
        )
        .eq('company_id', companyId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (pipelineId) {
        query = query.eq('pipeline_id', pipelineId);
      }

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      // Aplicar filtros no servidor quando possível
      if (filters?.assignedTo && filters.assignedTo !== 'all') {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.temperature && filters.temperature !== 'all') {
        query = query.eq('temperature', filters.temperature);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Filtrar por busca no cliente (não pode ser feito no servidor facilmente)
      let filteredData = (data as Deal[]) || [];
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(
          (deal) =>
            deal.title?.toLowerCase().includes(searchLower) ||
            deal.contacts?.name?.toLowerCase().includes(searchLower) ||
            deal.contacts?.phone_number?.toLowerCase().includes(searchLower)
        );
      }

      return { data: filteredData, count: count || 0 };
    },
    enabled: !!companyId,
    pageSize: options?.pageSize || PAGINATION.LIST_PAGE_SIZE,
    initialPage: options?.page || 1,
    staleTime: 2 * 60 * 1000, // 2 minutos cache
  });

  const deals = dealsQuery.data || [];
  const isLoading = dealsQuery.isLoading;

  const createDeal = useMutation({
    mutationFn: async (deal: TablesInsert<'deals'>) => {
      if (!companyId) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('deals')
        .insert({ ...deal, company_id: companyId })
        .select(
          `
          *,
          contacts (*),
          pipeline_stages (*),
          profiles!assigned_to (*)
        `
        )
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('deal_activities').insert({
        deal_id: data.id,
        activity_type: 'created',
        description: 'Negócio criado',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Negócio criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar negócio: ' + error.message);
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'deals'> & { id: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          contacts (*),
          pipeline_stages (*),
          profiles!assigned_to (*)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Negócio atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar negócio: ' + error.message);
    },
  });

  const moveDeal = useMutation({
    mutationFn: async ({ dealId, targetStageId }: { dealId: string; targetStageId: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update({
          stage_id: targetStageId,
          last_activity: new Date().toISOString(),
        })
        .eq('id', dealId)
        .select(
          `
          *,
          contacts (*),
          pipeline_stages (*),
          profiles!assigned_to (*)
        `
        )
        .single();

      if (error) throw error;

      // Get stage info for activity log and automation rules
      const { data: newStage } = await supabase
        .from('pipeline_stages')
        .select('name, automation_rules')
        .eq('id', targetStageId)
        .single();

      // Log activity
      await supabase.from('deal_activities').insert({
        deal_id: dealId,
        activity_type: 'stage_change',
        description: `Movido para "${newStage?.name}"`,
      });

      // Execute automation rules if any
      if (newStage?.automation_rules) {
        executeAutomations(dealId, newStage.automation_rules as unknown as AutomationRule[]).catch((err) => {
          console.error('Erro ao executar automações:', err);
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: (error) => {
      toast.error('Erro ao mover negócio: ' + error.message);
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Negócio excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir negócio: ' + error.message);
    },
  });

  // Real-time subscription para deals
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log('Deal change detected:', payload);
          // Invalidar queries para recarregar dados
          queryClient.invalidateQueries({ queryKey: ['deals', companyId] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [companyId, queryClient]);

  return {
    deals,
    isLoading,
    createDeal,
    updateDeal,
    moveDeal,
    deleteDeal,
    // Paginação
    pagination: {
      page: dealsQuery.page,
      pageSize: dealsQuery.pageSize,
      total: dealsQuery.total,
      totalPages: dealsQuery.totalPages,
      hasNext: dealsQuery.hasNext,
      hasPrev: dealsQuery.hasPrev,
      nextPage: dealsQuery.nextPage,
      prevPage: dealsQuery.prevPage,
      goToPage: dealsQuery.goToPage,
      setPageSize: dealsQuery.setPageSize,
    },
  };
};
