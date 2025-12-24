import {
  AgentPerformanceMetrics,
  LoadLevel,
  ConversationQualityScore,
} from '@/types/ai-assistant';

// Limites para níveis de carga
const LOAD_THRESHOLDS = {
  low: 3,
  medium: 6,
  high: 10,
  overloaded: 15,
};

// Limites para tempo de resposta (segundos)
const RESPONSE_TIME_THRESHOLDS = {
  excellent: 60,    // < 1 min
  good: 180,        // < 3 min
  acceptable: 300,  // < 5 min
  slow: 600,        // < 10 min
  critical: 900,    // > 15 min
};

/**
 * Calcula o nível de carga do agente
 */
export function calculateLoadLevel(activeConversations: number): LoadLevel {
  if (activeConversations <= LOAD_THRESHOLDS.low) return 'low';
  if (activeConversations <= LOAD_THRESHOLDS.medium) return 'medium';
  if (activeConversations <= LOAD_THRESHOLDS.high) return 'high';
  return 'overloaded';
}

/**
 * Calcula a classificação do tempo de resposta
 */
export function classifyResponseTime(seconds: number): {
  classification: 'excellent' | 'good' | 'acceptable' | 'slow' | 'critical';
  color: string;
  label: string;
} {
  if (seconds <= RESPONSE_TIME_THRESHOLDS.excellent) {
    return { classification: 'excellent', color: 'green', label: 'Excelente' };
  }
  if (seconds <= RESPONSE_TIME_THRESHOLDS.good) {
    return { classification: 'good', color: 'green', label: 'Bom' };
  }
  if (seconds <= RESPONSE_TIME_THRESHOLDS.acceptable) {
    return { classification: 'acceptable', color: 'yellow', label: 'Aceitável' };
  }
  if (seconds <= RESPONSE_TIME_THRESHOLDS.slow) {
    return { classification: 'slow', color: 'orange', label: 'Lento' };
  }
  return { classification: 'critical', color: 'red', label: 'Crítico' };
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calcula variação em pontos (para scores)
 */
export function calculatePointsChange(current: number, previous: number): number {
  return current - previous;
}

/**
 * Calcula média de scores de qualidade
 */
export function calculateAverageQualityScore(
  scores: ConversationQualityScore[]
): number | null {
  const validScores = scores.filter((s) => s.overall_score !== null);
  if (validScores.length === 0) return null;

  const sum = validScores.reduce((acc, s) => acc + (s.overall_score || 0), 0);
  return Math.round(sum / validScores.length);
}

/**
 * Calcula breakdown de scores de qualidade
 */
export function calculateQualityBreakdown(
  scores: ConversationQualityScore[]
): {
  overall: number | null;
  empathy: number | null;
  resolution: number | null;
  tone: number | null;
  professionalism: number | null;
  responseQuality: number | null;
} {
  if (scores.length === 0) {
    return {
      overall: null,
      empathy: null,
      resolution: null,
      tone: null,
      professionalism: null,
      responseQuality: null,
    };
  }

  const calculateAvg = (key: keyof ConversationQualityScore): number | null => {
    const validScores = scores.filter((s) => s[key] !== null);
    if (validScores.length === 0) return null;
    const sum = validScores.reduce((acc, s) => acc + ((s[key] as number) || 0), 0);
    return Math.round(sum / validScores.length);
  };

  return {
    overall: calculateAvg('overall_score'),
    empathy: calculateAvg('empathy_score'),
    resolution: calculateAvg('resolution_score'),
    tone: calculateAvg('tone_score'),
    professionalism: calculateAvg('professionalism_score'),
    responseQuality: calculateAvg('response_quality_score'),
  };
}

/**
 * Calcula tempo médio de resposta
 */
export function calculateAverageResponseTime(
  responseTimes: number[]
): number | null {
  if (responseTimes.length === 0) return null;
  const sum = responseTimes.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / responseTimes.length);
}

/**
 * Calcula métricas de performance agregadas para um agente
 */
export function calculateAgentMetrics(
  agentId: string,
  agentName: string,
  data: {
    conversationsToday: number;
    conversationsYesterday: number;
    avgResponseTimeToday: number;
    avgResponseTimeYesterday: number;
    qualityScoreToday: number;
    qualityScoreYesterday: number;
    activeConversations: number;
    waitingConversations: number;
    isOnline: boolean;
  }
): AgentPerformanceMetrics {
  return {
    agent_id: agentId,
    agent_name: agentName,
    conversations_today: data.conversationsToday,
    avg_response_time_today: data.avgResponseTimeToday,
    quality_score_today: data.qualityScoreToday,
    conversations_change: calculatePercentageChange(
      data.conversationsToday,
      data.conversationsYesterday
    ),
    response_time_change: calculatePercentageChange(
      data.avgResponseTimeToday,
      data.avgResponseTimeYesterday
    ),
    quality_change: calculatePointsChange(
      data.qualityScoreToday,
      data.qualityScoreYesterday
    ),
    active_conversations: data.activeConversations,
    waiting_conversations: data.waitingConversations,
    is_online: data.isOnline,
    current_load: calculateLoadLevel(data.activeConversations),
  };
}

/**
 * Calcula tendência de um conjunto de valores
 */
export function calculateTrend(
  values: number[]
): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = calculatePercentageChange(avgSecond, avgFirst);

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

/**
 * Formata tempo de resposta para exibição
 */
export function formatResponseTime(seconds: number | null): string {
  if (seconds === null || seconds === 0) return '--';
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Formata variação percentual para exibição
 */
export function formatPercentageChange(change: number): {
  text: string;
  color: string;
  icon: 'up' | 'down' | 'stable';
} {
  const absChange = Math.abs(change);
  const text = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;

  if (absChange < 1) {
    return { text: '~0%', color: 'gray', icon: 'stable' };
  }

  if (change > 0) {
    return { text, color: 'green', icon: 'up' };
  }

  return { text, color: 'red', icon: 'down' };
}

/**
 * Formata variação de pontos para exibição
 */
export function formatPointsChange(change: number): {
  text: string;
  color: string;
  icon: 'up' | 'down' | 'stable';
} {
  if (Math.abs(change) < 1) {
    return { text: '~0pts', color: 'gray', icon: 'stable' };
  }

  const text = `${change >= 0 ? '+' : ''}${change.toFixed(0)}pts`;

  if (change > 0) {
    return { text, color: 'green', icon: 'up' };
  }

  return { text, color: 'red', icon: 'down' };
}

/**
 * Calcula score de saúde geral do atendimento
 */
export function calculateHealthScore(
  avgQuality: number,
  avgResponseTime: number,
  waitingConversations: number
): {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  color: string;
} {
  let score = 100;

  // Penalizar por qualidade baixa
  if (avgQuality < 80) score -= (80 - avgQuality) * 0.5;
  if (avgQuality < 60) score -= 15;

  // Penalizar por tempo de resposta longo
  if (avgResponseTime > 180) score -= 10;
  if (avgResponseTime > 300) score -= 15;
  if (avgResponseTime > 600) score -= 20;

  // Penalizar por conversas esperando
  if (waitingConversations > 0) score -= waitingConversations * 5;

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) {
    return { score, status: 'healthy', color: 'green' };
  }
  if (score >= 50) {
    return { score, status: 'warning', color: 'yellow' };
  }
  return { score, status: 'critical', color: 'red' };
}

/**
 * Agrupa conversas por hora para gráfico
 */
export function groupByHour(
  items: { created_at: string }[],
  hours: number = 24
): Map<string, number> {
  const result = new Map<string, number>();
  const now = new Date();

  // Inicializar todas as horas com 0
  for (let i = hours - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i, 0, 0, 0);
    const key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    result.set(key, 0);
  }

  // Contar items por hora
  items.forEach((item) => {
    const date = new Date(item.created_at);
    const key = date.toISOString().slice(0, 13);
    if (result.has(key)) {
      result.set(key, (result.get(key) || 0) + 1);
    }
  });

  return result;
}

/**
 * Calcula estatísticas básicas
 */
export function calculateStats(values: number[]): {
  min: number;
  max: number;
  avg: number;
  median: number;
} {
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
  };
}
