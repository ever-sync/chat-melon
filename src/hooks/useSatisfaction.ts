import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './crm/useCompanyQuery';

export interface SatisfactionSurvey {
  id: string;
  conversation_id: string;
  contact_id: string | null;
  assigned_to: string | null;
  survey_type: 'csat' | 'nps';
  score: number | null;
  feedback: string | null;
  sent_at: string;
  answered_at: string | null;
  status: 'sent' | 'answered' | 'expired';
}

export interface SatisfactionMetrics {
  avgScore: number;
  totalResponses: number;
  responseRate: number;
  promoters?: number;
  passives?: number;
  detractors?: number;
  npsScore?: number;
}

export const useSatisfaction = () => {
  const { companyId } = useCompanyQuery();
  const [surveys, setSurveys] = useState<SatisfactionSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSurveys = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('satisfaction_surveys')
        .select('*')
        .eq('company_id', companyId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setSurveys((data as SatisfactionSurvey[]) || []);
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();

    const channel = supabase
      .channel('satisfaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'satisfaction_surveys',
        },
        () => {
          loadSurveys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const getMetrics = (period: 'week' | 'month' | 'quarter' = 'month'): SatisfactionMetrics => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    const periodSurveys = surveys.filter((s) => {
      const sentDate = new Date(s.sent_at);
      return sentDate >= startDate && s.status === 'answered' && s.score !== null;
    });

    const totalSent = surveys.filter((s) => {
      const sentDate = new Date(s.sent_at);
      return sentDate >= startDate;
    }).length;

    const totalResponses = periodSurveys.length;
    const responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0;

    if (periodSurveys.length === 0) {
      return {
        avgScore: 0,
        totalResponses: 0,
        responseRate: 0,
      };
    }

    const avgScore = periodSurveys.reduce((sum, s) => sum + (s.score || 0), 0) / totalResponses;

    // Calcular NPS se for tipo NPS
    const firstSurvey = periodSurveys[0];
    if (firstSurvey?.survey_type === 'nps') {
      const promoters = periodSurveys.filter((s) => (s.score || 0) >= 9).length;
      const passives = periodSurveys.filter(
        (s) => (s.score || 0) >= 7 && (s.score || 0) <= 8
      ).length;
      const detractors = periodSurveys.filter((s) => (s.score || 0) <= 6).length;
      const npsScore = ((promoters - detractors) / totalResponses) * 100;

      return {
        avgScore,
        totalResponses,
        responseRate,
        promoters,
        passives,
        detractors,
        npsScore,
      };
    }

    return {
      avgScore,
      totalResponses,
      responseRate,
    };
  };

  const getMetricsByAgent = () => {
    const answered = surveys.filter((s) => s.status === 'answered' && s.score !== null);
    const grouped = answered.reduce(
      (acc, survey) => {
        if (!survey.assigned_to) return acc;

        if (!acc[survey.assigned_to]) {
          acc[survey.assigned_to] = {
            scores: [],
            count: 0,
          };
        }

        acc[survey.assigned_to].scores.push(survey.score || 0);
        acc[survey.assigned_to].count++;

        return acc;
      },
      {} as Record<string, { scores: number[]; count: number }>
    );

    return Object.entries(grouped)
      .map(([agentId, data]) => ({
        agent_id: agentId,
        avg_score: data.scores.reduce((a, b) => a + b, 0) / data.count,
        total_responses: data.count,
      }))
      .sort((a, b) => b.avg_score - a.avg_score);
  };

  const getNegativeFeedback = () => {
    return surveys
      .filter((s) => {
        if (!s.score || !s.feedback) return false;
        if (s.survey_type === 'csat') return s.score < 3;
        if (s.survey_type === 'nps') return s.score < 7;
        return false;
      })
      .sort(
        (a, b) => new Date(b.answered_at || '').getTime() - new Date(a.answered_at || '').getTime()
      )
      .slice(0, 10);
  };

  return {
    surveys,
    loading,
    getMetrics,
    getMetricsByAgent,
    getNegativeFeedback,
  };
};
