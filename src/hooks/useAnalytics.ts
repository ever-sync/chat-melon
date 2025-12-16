import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./crm/useCompanyQuery";
import { startOfMonth, endOfMonth, subMonths, format, startOfDay } from "date-fns";

export interface RevenueData {
  month: string;
  value: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  value: number;
  color: string;
}

export interface UserRanking {
  user_id: string;
  user_name: string;
  deals_count: number;
  total_value: number;
  avg_value: number;
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  openDeals: number;
  conversionRate: number;
  avgResponseTime: number;
  avgPipelineTime: number;
  wonDealsCount: number;
  lostDealsCount: number;
  totalDealsCount: number;
}

export interface ForecastData {
  realized: number;
  goal: number;
  forecastConservative: number;
  forecastRealistic: number;
  forecastOptimistic: number;
  stageBreakdown: Array<{
    stage: string;
    totalValue: number;
    probability: number;
    forecastValue: number;
    color: string;
  }>;
  salesRepBreakdown: Array<{
    name: string;
    forecast: number;
    goalProgress: number;
  }>;
  alerts: string[];
  accuracy?: {
    previousForecast: number;
    previousRealized: number;
    accuracyPercent: number;
  };
}

export const useAnalytics = (months: number = 6, pipelineId?: string) => {
  const { companyId } = useCompanyQuery();

  // Métricas principais
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["analytics-metrics", companyId, pipelineId],
    queryFn: async () => {
      if (!companyId) return null;

      let query = supabase
        .from("deals")
        .select("*")
        .eq("company_id", companyId);

      if (pipelineId) {
        query = query.eq("pipeline_id", pipelineId);
      }

      const { data: deals } = await query;

      if (!deals) return null;

      const wonDeals = deals.filter(d => d.status === "won");
      const lostDeals = deals.filter(d => d.status === "lost");
      const openDeals = deals.filter(d => d.status === "open");

      const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const conversionRate = deals.length > 0 
        ? (wonDeals.length / deals.length) * 100 
        : 0;

      // Calcular tempo médio no pipeline
      let totalPipelineTime = 0;
      wonDeals.forEach(deal => {
        if (deal.created_at && deal.won_at) {
          const start = new Date(deal.created_at);
          const end = new Date(deal.won_at);
          const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          totalPipelineTime += diffDays;
        }
      });
      const avgPipelineTime = wonDeals.length > 0 
        ? Math.floor(totalPipelineTime / wonDeals.length) 
        : 0;

      return {
        totalRevenue,
        openDeals: openDeals.length,
        conversionRate: Math.round(conversionRate),
        avgResponseTime: 0, // TODO: implementar quando tiver dados de mensagens
        avgPipelineTime,
        wonDealsCount: wonDeals.length,
        lostDealsCount: lostDeals.length,
        totalDealsCount: deals.length,
      } as AnalyticsMetrics;
    },
    enabled: !!companyId,
  });

  // Receita mensal
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["analytics-revenue", companyId, months, pipelineId],
    queryFn: async () => {
      if (!companyId) return [];

      const monthsArray: RevenueData[] = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);

        let query = supabase
          .from("deals")
          .select("value, won_at")
          .eq("company_id", companyId)
          .eq("status", "won")
          .gte("won_at", start.toISOString())
          .lte("won_at", end.toISOString());

        if (pipelineId) {
          query = query.eq("pipeline_id", pipelineId);
        }

        const { data: deals } = await query;

        const totalValue = deals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

        monthsArray.push({
          month: format(monthDate, "MMM/yy"),
          value: totalValue,
        });
      }

      return monthsArray;
    },
    enabled: !!companyId,
  });

  // Funil de conversão
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ["analytics-funnel", companyId, pipelineId],
    queryFn: async () => {
      if (!companyId) return [];

      let stagesQuery = supabase
        .from("pipeline_stages")
        .select(`
          id,
          name,
          color,
          order_index,
          pipeline_id,
          pipelines!inner(company_id)
        `)
        .eq("pipelines.company_id", companyId);

      if (pipelineId) {
        stagesQuery = stagesQuery.eq("pipeline_id", pipelineId);
      }

      const { data: stages } = await stagesQuery.order("order_index");

      if (!stages) return [];

      const funnelStages: FunnelStage[] = [];

      for (const stage of stages) {
        const { data: deals, count } = await supabase
          .from("deals")
          .select("value", { count: "exact" })
          .eq("stage_id", stage.id)
          .eq("status", "open");

        const totalValue = deals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

        funnelStages.push({
          name: stage.name,
          count: count || 0,
          value: totalValue,
          color: stage.color || "#3B82F6",
        });
      }

      return funnelStages;
    },
    enabled: !!companyId,
  });

  // Ranking de vendedores
  const { data: rankingData, isLoading: rankingLoading } = useQuery({
    queryKey: ["analytics-ranking", companyId, pipelineId],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from("deals")
        .select(`
          value,
          assigned_to,
          status,
          profiles!deals_assigned_to_fkey(full_name)
        `)
        .eq("company_id", companyId)
        .eq("status", "won")
        .not("assigned_to", "is", null);

      if (pipelineId) {
        query = query.eq("pipeline_id", pipelineId);
      }

      const { data: deals } = await query;

      if (!deals) return [];

      // Agrupar por usuário
      const userMap = new Map<string, UserRanking>();

      deals.forEach(deal => {
        const userId = deal.assigned_to;
        if (!userId) return;

        const userName = (deal.profiles as any)?.full_name || "Sem nome";
        const value = deal.value || 0;

        if (userMap.has(userId)) {
          const existing = userMap.get(userId)!;
          existing.deals_count += 1;
          existing.total_value += value;
          existing.avg_value = existing.total_value / existing.deals_count;
        } else {
          userMap.set(userId, {
            user_id: userId,
            user_name: userName,
            deals_count: 1,
            total_value: value,
            avg_value: value,
          });
        }
      });

      // Converter para array e ordenar por total_value
      return Array.from(userMap.values())
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 10);
    },
    enabled: !!companyId,
  });

  // Forecast de vendas
  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ["analytics-forecast", companyId, pipelineId],
    queryFn: async () => {
      if (!companyId) return null;

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));

      // Buscar deals abertos com expected_close_date neste mês
      let openDealsQuery = supabase
        .from("deals")
        .select(`
          *,
          pipeline_stages!inner(name, color, probability_default),
          profiles!deals_assigned_to_fkey(full_name)
        `)
        .eq("company_id", companyId)
        .eq("status", "open")
        .gte("expected_close_date", currentMonthStart.toISOString().split("T")[0])
        .lte("expected_close_date", currentMonthEnd.toISOString().split("T")[0]);

      if (pipelineId) {
        openDealsQuery = openDealsQuery.eq("pipeline_id", pipelineId);
      }

      const { data: openDeals } = await openDealsQuery;

      // Buscar deals ganhos neste mês (realized)
      let wonDealsQuery = supabase
        .from("deals")
        .select("value")
        .eq("company_id", companyId)
        .eq("status", "won")
        .gte("won_at", currentMonthStart.toISOString())
        .lte("won_at", currentMonthEnd.toISOString());

      if (pipelineId) {
        wonDealsQuery = wonDealsQuery.eq("pipeline_id", pipelineId);
      }

      const { data: wonDealsThisMonth } = await wonDealsQuery;

      const realized = wonDealsThisMonth?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

      // Meta do mês (pode ser configurável futuramente)
      const goal = 80000; // R$ 80.000 como meta padrão

      // Calcular forecasts
      let forecastConservative = 0;
      let forecastRealistic = 0;
      let forecastOptimistic = 0;

      // Breakdown por stage
      const stageMap = new Map<string, {
        stage: string;
        totalValue: number;
        probability: number;
        forecastValue: number;
        color: string;
      }>();

      // Breakdown por vendedor
      const salesRepMap = new Map<string, {
        name: string;
        forecast: number;
        goalProgress: number;
      }>();

      openDeals?.forEach((deal) => {
        const value = deal.value || 0;
        const probability = deal.probability || deal.pipeline_stages?.probability_default || 50;
        const stageName = deal.pipeline_stages?.name || "Sem Stage";
        const stageColor = deal.pipeline_stages?.color || "#3B82F6";
        const assignedName = (deal.profiles as any)?.full_name || "Não atribuído";

        const forecastValue = (value * probability) / 100;

        // Cenários
        if (probability > 75) {
          forecastConservative += value;
        }
        forecastRealistic += forecastValue;
        forecastOptimistic += value;

        // Agrupar por stage
        if (stageMap.has(stageName)) {
          const existing = stageMap.get(stageName)!;
          existing.totalValue += value;
          existing.forecastValue += forecastValue;
        } else {
          stageMap.set(stageName, {
            stage: stageName,
            totalValue: value,
            probability,
            forecastValue,
            color: stageColor,
          });
        }

        // Agrupar por vendedor
        if (deal.assigned_to) {
          if (salesRepMap.has(deal.assigned_to)) {
            const existing = salesRepMap.get(deal.assigned_to)!;
            existing.forecast += forecastValue;
          } else {
            salesRepMap.set(deal.assigned_to, {
              name: assignedName,
              forecast: forecastValue,
              goalProgress: 0, // Calculado depois
            });
          }
        }
      });

      // Adicionar realized ao forecast
      forecastConservative += realized;
      forecastRealistic += realized;
      forecastOptimistic += realized;

      // Calcular goalProgress para cada vendedor
      const salesRepBreakdown = Array.from(salesRepMap.values()).map(rep => ({
        ...rep,
        goalProgress: goal > 0 ? (rep.forecast / goal) * 100 : 0,
      })).sort((a, b) => b.forecast - a.forecast);

      // Breakdown por stage
      const stageBreakdown = Array.from(stageMap.values()).sort((a, b) => b.probability - a.probability);

      // Alertas
      const alerts: string[] = [];
      const needed = goal - realized;
      if (needed > 0) {
        alerts.push(`Você precisa de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(needed)} para bater a meta`);
      }
      const forecastPercent = goal > 0 ? (forecastRealistic / goal) * 100 : 0;
      alerts.push(`Com o pipeline atual, previsão é ${Math.round(forecastPercent)}% da meta`);
      
      if (forecastPercent < 80) {
        alerts.push("Considere reativar leads frios ou acelerar negociações em andamento");
      }

      // Acurácia do mês anterior (buscar deals do mês passado)
      const { data: previousWonDeals } = await supabase
        .from("deals")
        .select("value")
        .eq("company_id", companyId)
        .eq("status", "won")
        .gte("won_at", previousMonthStart.toISOString())
        .lte("won_at", previousMonthEnd.toISOString());

      const previousRealized = previousWonDeals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      
      // Forecast do mês anterior (simplificado - usar média dos últimos 3 meses)
      const previousForecast = previousRealized > 0 ? previousRealized * 1.1 : 0;
      const accuracyPercent = previousForecast > 0 ? (previousRealized / previousForecast) * 100 : 0;

      return {
        realized,
        goal,
        forecastConservative,
        forecastRealistic,
        forecastOptimistic,
        stageBreakdown,
        salesRepBreakdown,
        alerts,
        accuracy: previousRealized > 0 ? {
          previousForecast,
          previousRealized,
          accuracyPercent,
        } : undefined,
      } as ForecastData;
    },
    enabled: !!companyId,
  });

  return {
    metrics,
    revenueData,
    funnelData,
    rankingData,
    forecastData,
    isLoading: metricsLoading || revenueLoading || funnelLoading || rankingLoading || forecastLoading,
  };
};
