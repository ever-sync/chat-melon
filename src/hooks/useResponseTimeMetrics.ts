import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

interface ResponseTimeMetrics {
  avgResponseSeconds: number | null;
  avgResponseFormatted: string;
  totalResponses: number;
  fastestResponseSeconds: number | null;
  slowestResponseSeconds: number | null;
  responsesUnder5min: number;
  responsesUnder30min: number;
  responsesOver30min: number;
}

interface ResponseTimeByAgent {
  agentId: string;
  agentName: string;
  agentEmail: string;
  avgResponseSeconds: number | null;
  avgResponseFormatted: string;
  totalResponses: number;
  fastestResponseSeconds: number | null;
}

interface ResponseTimeByHour {
  hourOfDay: number;
  avgResponseSeconds: number | null;
  totalResponses: number;
}

interface ResponseTimeTrend {
  currentPeriodAvg: number | null;
  previousPeriodAvg: number | null;
  trendPercentage: number;
  trendDirection: "improving" | "declining" | "stable" | "neutral";
}

interface FirstResponseMetrics {
  avgFrtSeconds: number | null;
  avgFrtFormatted: string;
  totalConversations: number;
  frtUnder5min: number;
  frtUnder15min: number;
  frtUnder1hour: number;
  frtOver1hour: number;
}

interface UseResponseTimeMetricsOptions {
  startDate?: Date;
  endDate?: Date;
  agentId?: string;
  enabled?: boolean;
}

export function useResponseTimeMetrics(options: UseResponseTimeMetricsOptions = {}) {
  const { currentCompany } = useCompany();
  const { startDate, endDate, agentId, enabled = true } = options;

  // Average response time
  const {
    data: avgResponseTime,
    isLoading: avgLoading,
    error: avgError,
  } = useQuery({
    queryKey: ["response-time-avg", currentCompany?.id, startDate, endDate, agentId],
    queryFn: async (): Promise<ResponseTimeMetrics | null> => {
      if (!currentCompany?.id) return null;

      const { data, error } = await supabase.rpc("calculate_avg_response_time", {
        p_company_id: currentCompany.id,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
        p_agent_id: agentId || null,
      });

      if (error) {
        console.error("Error fetching avg response time:", error);
        return null;
      }

      const result = data?.[0];
      if (!result) return null;

      return {
        avgResponseSeconds: result.avg_response_seconds,
        avgResponseFormatted: result.avg_response_formatted || "0s",
        totalResponses: result.total_responses || 0,
        fastestResponseSeconds: result.fastest_response_seconds,
        slowestResponseSeconds: result.slowest_response_seconds,
        responsesUnder5min: result.responses_under_5min || 0,
        responsesUnder30min: result.responses_under_30min || 0,
        responsesOver30min: result.responses_over_30min || 0,
      };
    },
    enabled: enabled && !!currentCompany?.id,
  });

  // Response time by agent
  const {
    data: byAgent,
    isLoading: byAgentLoading,
  } = useQuery({
    queryKey: ["response-time-by-agent", currentCompany?.id, startDate, endDate],
    queryFn: async (): Promise<ResponseTimeByAgent[]> => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase.rpc("calculate_response_time_by_agent", {
        p_company_id: currentCompany.id,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });

      if (error) {
        console.error("Error fetching response time by agent:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        agentId: row.agent_id,
        agentName: row.agent_name || "Desconhecido",
        agentEmail: row.agent_email || "",
        avgResponseSeconds: row.avg_response_seconds,
        avgResponseFormatted: row.avg_response_formatted || "0s",
        totalResponses: row.total_responses || 0,
        fastestResponseSeconds: row.fastest_response_seconds,
      }));
    },
    enabled: enabled && !!currentCompany?.id,
  });

  // Response time by hour
  const {
    data: byHour,
    isLoading: byHourLoading,
  } = useQuery({
    queryKey: ["response-time-by-hour", currentCompany?.id, startDate, endDate],
    queryFn: async (): Promise<ResponseTimeByHour[]> => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase.rpc("calculate_response_time_by_hour", {
        p_company_id: currentCompany.id,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });

      if (error) {
        console.error("Error fetching response time by hour:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        hourOfDay: row.hour_of_day,
        avgResponseSeconds: row.avg_response_seconds,
        totalResponses: row.total_responses || 0,
      }));
    },
    enabled: enabled && !!currentCompany?.id,
  });

  // Response time trend
  const {
    data: trend,
    isLoading: trendLoading,
  } = useQuery({
    queryKey: ["response-time-trend", currentCompany?.id],
    queryFn: async (): Promise<ResponseTimeTrend | null> => {
      if (!currentCompany?.id) return null;

      const { data, error } = await supabase.rpc("calculate_response_time_trend", {
        p_company_id: currentCompany.id,
      });

      if (error) {
        console.error("Error fetching response time trend:", error);
        return null;
      }

      const result = data?.[0];
      if (!result) return null;

      return {
        currentPeriodAvg: result.current_period_avg,
        previousPeriodAvg: result.previous_period_avg,
        trendPercentage: result.trend_percentage || 0,
        trendDirection: result.trend_direction || "neutral",
      };
    },
    enabled: enabled && !!currentCompany?.id,
  });

  // First response time
  const {
    data: firstResponseTime,
    isLoading: frtLoading,
  } = useQuery({
    queryKey: ["first-response-time", currentCompany?.id, startDate, endDate],
    queryFn: async (): Promise<FirstResponseMetrics | null> => {
      if (!currentCompany?.id) return null;

      const { data, error } = await supabase.rpc("calculate_first_response_time", {
        p_company_id: currentCompany.id,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });

      if (error) {
        console.error("Error fetching first response time:", error);
        return null;
      }

      const result = data?.[0];
      if (!result) return null;

      return {
        avgFrtSeconds: result.avg_frt_seconds,
        avgFrtFormatted: result.avg_frt_formatted || "0s",
        totalConversations: result.total_conversations || 0,
        frtUnder5min: result.frt_under_5min || 0,
        frtUnder15min: result.frt_under_15min || 0,
        frtUnder1hour: result.frt_under_1hour || 0,
        frtOver1hour: result.frt_over_1hour || 0,
      };
    },
    enabled: enabled && !!currentCompany?.id,
  });

  return {
    avgResponseTime,
    byAgent: byAgent || [],
    byHour: byHour || [],
    trend,
    firstResponseTime,
    isLoading: avgLoading || byAgentLoading || byHourLoading || trendLoading || frtLoading,
    error: avgError,
  };
}

// Helper function to format seconds to human-readable string
export function formatResponseTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "0s";

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)}min`;
  } else {
    return `${(seconds / 3600).toFixed(1)}h`;
  }
}

// Helper to get color based on response time
export function getResponseTimeColor(seconds: number | null): string {
  if (seconds === null) return "text-gray-500";
  if (seconds <= 300) return "text-green-600"; // Under 5 min - excellent
  if (seconds <= 900) return "text-blue-600"; // Under 15 min - good
  if (seconds <= 1800) return "text-yellow-600"; // Under 30 min - ok
  return "text-red-600"; // Over 30 min - needs improvement
}

export default useResponseTimeMetrics;
