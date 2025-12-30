import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import type { Tables } from '@/integrations/supabase/types';

export type Pipeline = Tables<'pipelines'> & {
  settings?: PipelineSettings;
};
export type PipelineStage = Tables<'pipeline_stages'>;

// Configurações do pipeline
export interface PipelineSettings {
  // Automações de Fechamento
  auto_archive_won_days: number | null;
  auto_archive_lost_days: number | null;
  hide_archived_deals: boolean;

  // Notificações
  notify_deal_won: boolean;
  notify_deal_lost: boolean;
  notify_deal_stale: boolean;
  stale_days_threshold: number;
  notify_high_value_deal: boolean;
  high_value_threshold: number;

  // Email
  send_email_deal_won: boolean;
  send_email_deal_lost: boolean;
  email_recipients: string;

  // Automações
  auto_assign_round_robin: boolean;
  auto_create_task_on_stage_change: boolean;
  default_task_template: string;

  // Integrações
  webhook_url: string;
  webhook_events: string[];

  // Visualização
  show_deal_age: boolean;
  show_probability: boolean;
  show_expected_close_date: boolean;
  default_view: 'kanban' | 'list' | 'calendar';
}

export const usePipelines = (pipelineId?: string) => {
  const { companyId } = useCompanyQuery();

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline-with-stages', companyId, pipelineId],
    queryFn: async () => {
      if (!companyId) return { pipelines: [], stages: [] };

      // Query única que busca pipeline + stages juntos
      const { data: pipelines, error: pipelineError } = await supabase
        .from('pipelines')
        .select(
          `
          *,
          pipeline_stages (*)
        `
        )
        .eq('company_id', companyId)
        .order('order_index', { ascending: true });

      if (pipelineError) throw pipelineError;

      // Extrai stages do pipeline selecionado ou padrão
      const defaultPipeline = pipelines?.find((p) => p.is_default) || pipelines?.[0];
      const activePipeline = pipelineId
        ? pipelines?.find((p) => p.id === pipelineId)
        : defaultPipeline;

      const stages = (activePipeline?.pipeline_stages || []).sort(
        (a: PipelineStage, b: PipelineStage) => a.order_index - b.order_index
      );

      return {
        pipelines: pipelines || [],
        stages,
      };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos cache
  });

  // Obtém as configurações do pipeline ativo
  const activePipeline = pipelineId
    ? data?.pipelines?.find((p) => p.id === pipelineId)
    : data?.pipelines?.find((p) => p.is_default) || data?.pipelines?.[0];

  const pipelineSettings = (activePipeline?.settings as PipelineSettings) || null;

  return {
    pipelines: data?.pipelines || [],
    stages: data?.stages || [],
    defaultPipeline: data?.pipelines?.find((p) => p.is_default) || data?.pipelines?.[0],
    activePipeline,
    pipelineSettings,
    isLoading,
  };
};
