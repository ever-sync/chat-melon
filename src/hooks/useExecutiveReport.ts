import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./useCompanyQuery";
import { startOfMonth, endOfMonth, subMonths, differenceInDays, format } from "date-fns";

interface ExecutiveMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  pipeline: {
    open: number;
    forecast: number;
    goal: number;
  };
  conversion: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  performance: {
    avgFirstResponse: number;
    avgFirstResponsePrevious: number;
    avgClosingTime: number;
    avgClosingTimePrevious: number;
    avgTicket: number;
    avgTicketPrevious: number;
  };
  revenueHistory: {
    month: string;
    value: number;
  }[];
  topSellers: {
    name: string;
    revenue: number;
    deals: number;
  }[];
  leadSources: {
    source: string;
    count: number;
  }[];
}

export const useExecutiveReport = (period: 'current_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_12_months' = 'current_month') => {
  const { companyId } = useCompanyQuery();

  return useQuery({
    queryKey: ["executive-report", companyId, period],
    queryFn: async () => {
      if (!companyId) throw new Error("No company selected");

      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      switch (period) {
        case 'current_month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          previousStartDate = startOfMonth(subMonths(now, 1));
          previousEndDate = endOfMonth(subMonths(now, 1));
          break;
        case 'last_month':
          startDate = startOfMonth(subMonths(now, 1));
          endDate = endOfMonth(subMonths(now, 1));
          previousStartDate = startOfMonth(subMonths(now, 2));
          previousEndDate = endOfMonth(subMonths(now, 2));
          break;
        case 'last_3_months':
          startDate = startOfMonth(subMonths(now, 2));
          endDate = endOfMonth(now);
          previousStartDate = startOfMonth(subMonths(now, 5));
          previousEndDate = endOfMonth(subMonths(now, 3));
          break;
        case 'last_6_months':
          startDate = startOfMonth(subMonths(now, 5));
          endDate = endOfMonth(now);
          previousStartDate = startOfMonth(subMonths(now, 11));
          previousEndDate = endOfMonth(subMonths(now, 6));
          break;
        case 'last_12_months':
          startDate = startOfMonth(subMonths(now, 11));
          endDate = endOfMonth(now);
          previousStartDate = startOfMonth(subMonths(now, 23));
          previousEndDate = endOfMonth(subMonths(now, 12));
          break;
      }

      // Receita atual
      const { data: currentRevenue } = await supabase
        .from("deals")
        .select("value")
        .eq("company_id", companyId)
        .eq("status", "won")
        .gte("won_at", startDate.toISOString())
        .lte("won_at", endDate.toISOString());

      // Receita período anterior
      const { data: previousRevenue } = await supabase
        .from("deals")
        .select("value")
        .eq("company_id", companyId)
        .eq("status", "won")
        .gte("won_at", previousStartDate.toISOString())
        .lte("won_at", previousEndDate.toISOString());

      const currentRevenueTotal = currentRevenue?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const previousRevenueTotal = previousRevenue?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const revenueGrowth = previousRevenueTotal > 0 
        ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100 
        : 0;

      // Pipeline aberto
      const { data: openDeals } = await supabase
        .from("deals")
        .select("value, probability")
        .eq("company_id", companyId)
        .eq("status", "open");

      const openPipeline = openDeals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;
      const forecast = openDeals?.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0) || 0;

      // Meta (exemplo fixo, pode vir de tabela goals)
      const goal = 200000;

      // Funil de conversão
      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id, name, order_index")
        .eq("pipeline_id", (await supabase
          .from("pipelines")
          .select("id")
          .eq("company_id", companyId)
          .eq("is_default", true)
          .single()).data?.id || "")
        .order("order_index");

      const { data: allDeals } = await supabase
        .from("deals")
        .select("stage_id, status")
        .eq("company_id", companyId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const totalDeals = allDeals?.length || 0;
      const conversion = stages?.map(stage => {
        const count = allDeals?.filter(d => d.stage_id === stage.id).length || 0;
        return {
          stage: stage.name,
          count,
          percentage: totalDeals > 0 ? (count / totalDeals) * 100 : 0
        };
      }) || [];

      // Performance - tempo primeira resposta (simulado - pode ser calculado de conversações/mensagens)
      const avgFirstResponse = 720; // 12 minutos em segundos
      const avgFirstResponsePrevious = 900; // 15 minutos em segundos

      // Tempo médio de fechamento
      const { data: wonDeals } = await supabase
        .from("deals")
        .select("created_at, won_at")
        .eq("company_id", companyId)
        .eq("status", "won")
        .not("won_at", "is", null)
        .gte("won_at", startDate.toISOString())
        .lte("won_at", endDate.toISOString());

      const { data: previousWonDeals } = await supabase
        .from("deals")
        .select("created_at, won_at")
        .eq("company_id", companyId)
        .eq("status", "won")
        .not("won_at", "is", null)
        .gte("won_at", previousStartDate.toISOString())
        .lte("won_at", previousEndDate.toISOString());

      const avgClosingTime = wonDeals?.length
        ? wonDeals.reduce((sum, d) => sum + differenceInDays(new Date(d.won_at!), new Date(d.created_at!)), 0) / wonDeals.length
        : 0;

      const avgClosingTimePrevious = previousWonDeals?.length
        ? previousWonDeals.reduce((sum, d) => sum + differenceInDays(new Date(d.won_at!), new Date(d.created_at!)), 0) / previousWonDeals.length
        : 0;

      // Ticket médio
      const avgTicket = currentRevenue?.length ? currentRevenueTotal / currentRevenue.length : 0;
      const avgTicketPrevious = previousRevenue?.length ? previousRevenueTotal / previousRevenue.length : 0;

      // Histórico de receita (12 meses)
      const revenueHistory = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: monthRevenue } = await supabase
          .from("deals")
          .select("value")
          .eq("company_id", companyId)
          .eq("status", "won")
          .gte("won_at", monthStart.toISOString())
          .lte("won_at", monthEnd.toISOString());

        revenueHistory.push({
          month: format(monthDate, "MMM"),
          value: monthRevenue?.reduce((sum, d) => sum + (d.value || 0), 0) || 0
        });
      }

      // Top vendedores
      const { data: dealsByUser } = await supabase
        .from("deals")
        .select("assigned_to, value, profiles!deals_assigned_to_fkey(full_name)")
        .eq("company_id", companyId)
        .eq("status", "won")
        .gte("won_at", startDate.toISOString())
        .lte("won_at", endDate.toISOString());

      const sellerMap = new Map<string, { name: string; revenue: number; deals: number }>();
      
      dealsByUser?.forEach(deal => {
        const userId = deal.assigned_to || "unassigned";
        const userName = deal.profiles?.full_name || "Não atribuído";
        
        if (!sellerMap.has(userId)) {
          sellerMap.set(userId, { name: userName, revenue: 0, deals: 0 });
        }
        
        const seller = sellerMap.get(userId)!;
        seller.revenue += deal.value || 0;
        seller.deals += 1;
      });

      const topSellers = Array.from(sellerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Origem dos leads
      const { data: contactSources } = await supabase
        .from("contacts")
        .select("enrichment_data")
        .eq("company_id", companyId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const sourceMap = new Map<string, number>();
      contactSources?.forEach(contact => {
        const source = (contact.enrichment_data as any)?.source || "Direto";
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const leadSources = Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count
      }));

      const metrics: ExecutiveMetrics = {
        revenue: {
          current: currentRevenueTotal,
          previous: previousRevenueTotal,
          growth: revenueGrowth
        },
        pipeline: {
          open: openPipeline,
          forecast,
          goal
        },
        conversion,
        performance: {
          avgFirstResponse,
          avgFirstResponsePrevious,
          avgClosingTime,
          avgClosingTimePrevious,
          avgTicket,
          avgTicketPrevious
        },
        revenueHistory,
        topSellers,
        leadSources
      };

      return metrics;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
};
