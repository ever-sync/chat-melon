import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { executeAutomations, type AutomationRule } from '@/lib/automations';
import { usePaginatedQuery } from '@/hooks/ui/usePaginatedQuery';
import { PAGINATION } from '@/config/constants';
import type { PipelineSettings } from './usePipelines';

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
  options?: { page?: number; pageSize?: number },
  pipelineSettings?: PipelineSettings | null
) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const dealsQuery = usePaginatedQuery<Deal>({
    queryKey: ['deals', companyId, pipelineId, contactId, filters, pipelineSettings?.hide_archived_deals],
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
        // Removido filtro .eq('status', 'open') para mostrar deals ganhos/perdidos nas colunas corretas
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

      // Filtrar negócios arquivados se a configuração estiver ativa
      if (pipelineSettings?.hide_archived_deals) {
        const now = new Date();

        filteredData = filteredData.filter((deal) => {
          // Se deal é ganho e temos configuração para ocultar após X dias
          if (deal.status === 'won' && deal.won_at && pipelineSettings.auto_archive_won_days) {
            const wonDate = new Date(deal.won_at);
            const daysSinceWon = Math.floor((now.getTime() - wonDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceWon >= pipelineSettings.auto_archive_won_days) {
              return false; // Ocultar
            }
          }

          // Se deal é perdido e temos configuração para ocultar após X dias
          if (deal.status === 'lost' && deal.lost_at && pipelineSettings.auto_archive_lost_days) {
            const lostDate = new Date(deal.lost_at);
            const daysSinceLost = Math.floor((now.getTime() - lostDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLost >= pipelineSettings.auto_archive_lost_days) {
              return false; // Ocultar
            }
          }

          return true;
        });
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
    mutationFn: async ({
      id,
      settings,
      ...updates
    }: TablesUpdate<'deals'> & { id: string; settings?: PipelineSettings | null }) => {
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

      // Verificar se é uma atualização de status (won/lost)
      if (settings) {
        const isWon = updates.status === 'won';
        const isLost = updates.status === 'lost';

        // Enviar notificação do sistema para negócio ganho
        if (isWon && settings.notify_deal_won) {
          toast.success(`🎉 Negócio "${data.title}" foi GANHO!`, {
            duration: 5000,
            description: `Valor: R$ ${data.value?.toLocaleString('pt-BR') || 0}`,
          });
        }

        // Enviar notificação do sistema para negócio perdido
        if (isLost && settings.notify_deal_lost) {
          toast.error(`😢 Negócio "${data.title}" foi perdido`, {
            duration: 5000,
            description: `Valor: R$ ${data.value?.toLocaleString('pt-BR') || 0}`,
          });
        }

        // Enviar webhook para negócio ganho
        if (isWon && settings.webhook_url && settings.webhook_events?.includes('won')) {
          try {
            await fetch(settings.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'deal.won',
                timestamp: new Date().toISOString(),
                data: {
                  deal_id: data.id,
                  deal_title: data.title,
                  deal_value: data.value,
                  contact_name: data.contacts?.name,
                  assigned_to: data.profiles?.full_name,
                  win_reason: data.win_reason,
                  won_at: data.won_at,
                },
              }),
            });
            console.log('📤 Webhook (deal.won) enviado para:', settings.webhook_url);
          } catch (webhookError) {
            console.error('Erro ao enviar webhook:', webhookError);
          }
        }

        // Enviar webhook para negócio perdido
        if (isLost && settings.webhook_url && settings.webhook_events?.includes('lost')) {
          try {
            await fetch(settings.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'deal.lost',
                timestamp: new Date().toISOString(),
                data: {
                  deal_id: data.id,
                  deal_title: data.title,
                  deal_value: data.value,
                  contact_name: data.contacts?.name,
                  assigned_to: data.profiles?.full_name,
                  loss_reason: data.loss_reason,
                  loss_reason_detail: data.loss_reason_detail,
                  lost_at: data.lost_at,
                },
              }),
            });
            console.log('📤 Webhook (deal.lost) enviado para:', settings.webhook_url);
          } catch (webhookError) {
            console.error('Erro ao enviar webhook:', webhookError);
          }
        }
      }

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
    mutationFn: async ({
      dealId,
      targetStageId,
      settings
    }: {
      dealId: string;
      targetStageId: string;
      settings?: PipelineSettings | null;
    }) => {
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
        .select('name, automation_rules, pipeline_id')
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

      // Criar tarefa automática se configurado nas settings do pipeline
      if (settings?.auto_create_task_on_stage_change) {
        try {
          const taskTitle = settings.default_task_template || `Acompanhar negócio - ${newStage?.name}`;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1); // Vencimento: amanhã

          await supabase.from('tasks').insert({
            company_id: data.company_id,
            title: taskTitle,
            description: `Tarefa automática criada ao mover negócio para etapa "${newStage?.name}"`,
            due_date: dueDate.toISOString(),
            priority: 'medium',
            status: 'pending',
            deal_id: dealId,
            contact_id: data.contact_id,
            assigned_to: data.assigned_to,
          });

          console.log('✅ Tarefa automática criada para o deal:', dealId);
        } catch (taskError) {
          console.error('Erro ao criar tarefa automática:', taskError);
        }
      }

      // Enviar webhook se configurado
      if (settings?.webhook_url && settings?.webhook_events?.includes('stage_changed')) {
        try {
          await fetch(settings.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'deal.stage_changed',
              timestamp: new Date().toISOString(),
              data: {
                deal_id: dealId,
                deal_title: data.title,
                deal_value: data.value,
                new_stage: newStage?.name,
                stage_id: targetStageId,
                contact_name: data.contacts?.name,
                assigned_to: data.profiles?.full_name,
              },
            }),
          });
          console.log('📤 Webhook enviado para:', settings.webhook_url);
        } catch (webhookError) {
          console.error('Erro ao enviar webhook:', webhookError);
        }
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
