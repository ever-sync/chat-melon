import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { executeAutomations, type AutomationRule } from '@/lib/automations';

export type Deal = Tables<'deals'> & {
  contacts: Tables<'contacts'> | null;
  pipeline_stages: Tables<'pipeline_stages'> | null;
  profiles: Tables<'profiles'> | null;
};

export const useDeals = (pipelineId?: string, contactId?: string) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', companyId, pipelineId, contactId],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('deals')
        .select(
          `
          *,
          contacts (*),
          pipeline_stages (*),
          profiles:assigned_to (*)
        `
        )
        .eq('company_id', companyId)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (pipelineId) {
        query = query.eq('pipeline_id', pipelineId);
      }

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutos cache
  });

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
          profiles:assigned_to (*)
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
          profiles:assigned_to (*)
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
          profiles:assigned_to (*)
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
        executeAutomations(dealId, newStage.automation_rules as AutomationRule[]).catch((err) => {
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
  };
};
