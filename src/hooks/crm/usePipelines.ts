import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import type { Tables } from '@/integrations/supabase/types';

export type Pipeline = Tables<'pipelines'>;
export type PipelineStage = Tables<'pipeline_stages'>;

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

  return {
    pipelines: data?.pipelines || [],
    stages: data?.stages || [],
    defaultPipeline: data?.pipelines?.find((p) => p.is_default) || data?.pipelines?.[0],
    isLoading,
  };
};
