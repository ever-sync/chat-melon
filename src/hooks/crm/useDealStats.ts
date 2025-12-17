import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

export type DealStageStats = {
  stage_id: string;
  pipeline_id: string;
  stage_name: string;
  color: string | null;
  order_index: number;
  deal_count: number;
  total_value: number;
  average_value: number;
  average_probability: number;
};

export type PipelineStats = {
  total_deals: number;
  total_value: number;
  average_deal_value: number;
  won_deals: number;
  lost_deals: number;
  won_value: number;
  lost_value: number;
  conversion_rate: number;
  average_time_to_close: number | null;
};

export const useDealStats = (pipelineId?: string) => {
  const { currentCompany } = useCompany();

  // Query para estatísticas por stage
  const { data: stageStats = [], isLoading: isLoadingStageStats } = useQuery({
    queryKey: ['deal-stats-by-stage', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return [];

      const { data, error } = await supabase
        .from('deal_stats_by_stage')
        .select('*')
        .eq('pipeline_id', pipelineId);

      if (error) throw error;
      return data as DealStageStats[];
    },
    enabled: !!pipelineId,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Query para estatísticas gerais do pipeline
  const { data: pipelineStats, isLoading: isLoadingPipelineStats } = useQuery({
    queryKey: ['pipeline-stats', pipelineId, currentCompany?.id],
    queryFn: async () => {
      if (!pipelineId || !currentCompany?.id) return null;

      // Buscar todos os deals do pipeline
      const { data: allDeals, error: allError } = await supabase
        .from('deals')
        .select('id, value, status, created_at, won_at, lost_at')
        .eq('pipeline_id', pipelineId)
        .eq('company_id', currentCompany.id);

      if (allError) throw allError;

      // Deals abertos
      const openDeals = allDeals.filter((d) => d.status === 'open');

      // Deals ganhos
      const wonDeals = allDeals.filter((d) => d.status === 'won');

      // Deals perdidos
      const lostDeals = allDeals.filter((d) => d.status === 'lost');

      // Calcular valores
      const totalValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const lostValue = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);

      // Taxa de conversão
      const totalClosed = wonDeals.length + lostDeals.length;
      const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

      // Tempo médio para fechar (em dias)
      const closedWithDates = wonDeals.filter((d) => d.won_at && d.created_at);
      let averageTimeToClose: number | null = null;

      if (closedWithDates.length > 0) {
        const totalDays = closedWithDates.reduce((sum, d) => {
          const created = new Date(d.created_at);
          const closed = new Date(d.won_at!);
          const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        averageTimeToClose = Math.round(totalDays / closedWithDates.length);
      }

      const stats: PipelineStats = {
        total_deals: openDeals.length,
        total_value: totalValue,
        average_deal_value: openDeals.length > 0 ? totalValue / openDeals.length : 0,
        won_deals: wonDeals.length,
        lost_deals: lostDeals.length,
        won_value: wonValue,
        lost_value: lostValue,
        conversion_rate: conversionRate,
        average_time_to_close: averageTimeToClose,
      };

      return stats;
    },
    enabled: !!pipelineId && !!currentCompany?.id,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Query para análise de funil (deals por stage com percentuais)
  const { data: funnelAnalysis, isLoading: isLoadingFunnel } = useQuery({
    queryKey: ['funnel-analysis', pipelineId, currentCompany?.id],
    queryFn: async () => {
      if (!pipelineId || !currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('deal_stats_by_stage')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const totalDeals = data.reduce((sum, stage) => sum + stage.deal_count, 0);

      return data.map((stage) => ({
        ...stage,
        percentage: totalDeals > 0 ? (stage.deal_count / totalDeals) * 100 : 0,
        conversion_from_previous: 0, // Calculado abaixo
      }));
    },
    enabled: !!pipelineId && !!currentCompany?.id,
    staleTime: 60 * 1000,
  });

  // Calcular conversão entre stages
  const funnelWithConversion = funnelAnalysis?.map((stage, index) => {
    if (index === 0) {
      return { ...stage, conversion_from_previous: 100 };
    }
    const previousStage = funnelAnalysis[index - 1];
    const conversion =
      previousStage.deal_count > 0 ? (stage.deal_count / previousStage.deal_count) * 100 : 0;
    return { ...stage, conversion_from_previous: conversion };
  });

  // Função para formatar moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para formatar percentual
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return {
    stageStats,
    pipelineStats,
    funnelAnalysis: funnelWithConversion,
    isLoading: isLoadingStageStats || isLoadingPipelineStats || isLoadingFunnel,
    formatCurrency,
    formatPercentage,
  };
};
