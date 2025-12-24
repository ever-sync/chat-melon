// =====================================================
// TIPOS DO ASSISTENTE DE IA PARA MONITORAMENTO
// =====================================================

// Enums
export type SuggestionType = 'response' | 'action' | 'alert' | 'tip';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type PatternType = 'recurring_issue' | 'success_pattern' | 'bottleneck' | 'performance_trend';
export type CoachingCategory = 'strength' | 'improvement_area' | 'achievement' | 'concern';
export type InsightStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved';
export type LoadLevel = 'low' | 'medium' | 'high' | 'overloaded';
export type NotificationLevel = 'all' | 'important' | 'critical' | 'none';
export type AssistantPosition = 'bottom-left' | 'bottom-right';
export type ImpactLevel = 'low' | 'medium' | 'high';

// Interfaces principais

export interface ConversationQualityScore {
  id: string;
  conversation_id: string;
  company_id: string;
  agent_id: string | null;

  // Scores (0-100)
  overall_score: number | null;
  empathy_score: number | null;
  resolution_score: number | null;
  tone_score: number | null;
  professionalism_score: number | null;
  response_quality_score: number | null;

  // Análises
  sentiment: Sentiment | null;
  detected_issues: DetectedIssue[];
  positive_highlights: string[];
  improvement_areas: string[];

  // Métricas
  avg_response_time: number | null; // segundos
  message_count: number;
  customer_satisfaction: number | null;

  analyzed_at: string;
  created_at: string;
}

export interface DetectedIssue {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface AgentPerformanceSnapshot {
  id: string;
  agent_id: string;
  company_id: string;

  // Métricas do momento
  active_conversations: number;
  waiting_conversations: number;
  avg_response_time: number | null; // segundos
  conversations_handled_today: number;
  quality_score_today: number | null;

  // Status
  is_online: boolean;
  current_load: LoadLevel | null;

  snapshot_at: string;
  created_at: string;
}

export interface AISuggestion {
  id: string;
  conversation_id: string;
  company_id: string;
  contact_id: string | null;

  // Sugestão
  title: string;
  content: string;
  suggestion_type: string;
  type?: SuggestionType; // Alias para compatibilidade
  priority: Priority;
  confidence: number | null;

  // Status e Feedback
  status: string | null;
  used_at: string | null;
  used_by: string | null;
  dismissed_reason: string | null;

  // Compatibilidade com código antigo (opcional)
  suggested_response?: string | null;
  description?: string | null;
  reasoning?: string | null;
  was_used?: boolean | null;
  was_useful?: boolean | null;
  agent_feedback?: string | null;

  created_at: string;
  expires_at: string | null;
  trigger_message_id: string | null;
  related_product_id: string | null;

  // Relações expandidas
  conversation?: {
    id: string;
    contact?: {
      name: string;
      phone: string;
    };
  };
}

export interface TriggerContext {
  trigger_type?: 'new_message' | 'long_wait' | 'low_quality' | 'pattern_detected' | 'manual';
  last_message?: string;
  customer_intent?: string;
  customer_sentiment?: Sentiment;
  wait_time_seconds?: number;
  quality_score?: number;
  additional_data?: Record<string, unknown>;
}

export interface DetectedPattern {
  id: string;
  company_id: string;
  agent_id: string | null;

  // Padrão
  pattern_type: PatternType;
  pattern_name: string;
  description: string | null;

  // Dados
  occurrences: number;
  confidence_score: number | null;
  impact_level: ImpactLevel | null;

  // Recomendações
  recommended_actions: RecommendedAction[];

  // Período
  detected_from: string | null;
  detected_to: string | null;

  is_resolved: boolean;
  resolved_at: string | null;

  created_at: string;
  last_updated: string;

  // Relações expandidas
  agent?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface RecommendedAction {
  action: string;
  priority: Priority;
  details?: string;
}

export interface CoachingInsight {
  id: string;
  agent_id: string;
  company_id: string;
  manager_id: string | null;

  // Insight
  category: CoachingCategory;
  title: string;
  description: string | null;

  // Evidências
  evidence: InsightEvidence;

  // Ação recomendada
  recommended_action: string | null;
  priority: Priority | null;

  // Acompanhamento
  status: InsightStatus;
  acknowledged_at: string | null;
  resolved_at: string | null;

  created_at: string;

  // Relações expandidas
  agent?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface InsightEvidence {
  examples?: string[];
  metrics?: Record<string, number>;
  conversations?: string[]; // IDs
  period?: {
    from: string;
    to: string;
  };
}

export interface AssistantSettings {
  id: string;
  user_id: string;
  company_id: string;

  // Preferências
  is_enabled: boolean;
  position: AssistantPosition;
  notification_level: NotificationLevel;

  // Tipos de alertas habilitados
  alert_slow_response: boolean;
  alert_quality_issues: boolean;
  alert_customer_frustration: boolean;
  alert_forgotten_conversations: boolean;

  // Limites personalizados
  slow_response_threshold: number; // segundos
  quality_threshold: number; // score mínimo

  // Sugestões
  show_response_suggestions: boolean;
  show_action_suggestions: boolean;
  show_coaching_tips: boolean;

  created_at: string;
  updated_at: string;
}

// Tipos para o estado do assistente no frontend

export interface AssistantState {
  isExpanded: boolean;
  activeTab: AssistantTab;
  isLoading: boolean;
  error: string | null;
  settings: AssistantSettings | null;
  unreadAlerts: number;
}

export type AssistantTab = 'performance' | 'suggestions' | 'tips' | 'alerts';

// Tipos para métricas agregadas

export interface AgentPerformanceMetrics {
  agent_id: string;
  agent_name: string;
  avatar_url?: string;

  // Hoje
  conversations_today: number;
  avg_response_time_today: number; // segundos
  quality_score_today: number;

  // Comparação com ontem
  conversations_change: number; // percentual
  response_time_change: number; // percentual
  quality_change: number; // pontos

  // Status atual
  active_conversations: number;
  waiting_conversations: number;
  is_online: boolean;
  current_load: LoadLevel;
}

export interface TeamPerformanceMetrics {
  company_id: string;
  period: 'today' | 'week' | 'month';

  // Agregados
  total_conversations: number;
  avg_response_time: number;
  avg_quality_score: number;

  // Comparação
  conversations_change: number;
  response_time_change: number;
  quality_change: number;

  // Breakdown
  agents: AgentPerformanceMetrics[];

  // Alertas
  critical_alerts_count: number;
  pending_insights_count: number;
}

// Tipos para análise de qualidade

export interface QualityAnalysisRequest {
  conversation_id: string;
  messages: MessageForAnalysis[];
  agent_id: string;
  contact_name?: string;
}

export interface MessageForAnalysis {
  id: string;
  content: string;
  sender_type: 'agent' | 'contact' | 'system';
  created_at: string;
}

export interface QualityAnalysisResult {
  overall_score: number;
  empathy_score: number;
  resolution_score: number;
  tone_score: number;
  professionalism_score: number;
  response_quality_score: number;
  sentiment: Sentiment;
  detected_issues: DetectedIssue[];
  positive_highlights: string[];
  improvement_areas: string[];
  suggestions: SuggestionForAgent[];
}

export interface SuggestionForAgent {
  type: SuggestionType;
  priority: Priority;
  title: string;
  description: string;
  suggested_response?: string;
  reasoning?: string;
}

// Tipos para sugestões contextuais

export interface SuggestionRequest {
  conversation_id: string;
  agent_id: string;
  trigger: 'new_message' | 'long_wait' | 'low_quality' | 'manual';
  context: {
    messages: MessageForAnalysis[];
    contact_info?: {
      name: string;
      company?: string;
      previous_conversations?: number;
    };
    deal_info?: {
      stage: string;
      value?: number;
    };
    wait_time?: number;
    quality_score?: number;
  };
}

export interface SuggestionResponse {
  suggestions: AISuggestion[];
}

// Tipos para notificações do assistente

export interface AssistantNotification {
  id: string;
  type: 'alert' | 'suggestion' | 'achievement' | 'tip';
  priority: Priority;
  title: string;
  message: string;
  action_url?: string;
  conversation_id?: string;
  created_at: string;
  read: boolean;
}

// Tipos para o dashboard gerencial

export interface ManagerDashboardData {
  overview: TeamPerformanceMetrics;
  patterns: DetectedPattern[];
  insights: CoachingInsight[];
  top_performers: AgentPerformanceMetrics[];
  needs_attention: AgentPerformanceMetrics[];
}

// Tipos para eventos real-time

export interface AssistantRealtimeEvent {
  type: 'new_suggestion' | 'new_alert' | 'performance_update' | 'new_insight' | 'pattern_detected';
  payload: AISuggestion | AgentPerformanceSnapshot | CoachingInsight | DetectedPattern;
  timestamp: string;
}

// Tipos para configuração de análise

export interface AnalysisConfig {
  enabled_analyses: {
    quality_scoring: boolean;
    sentiment_analysis: boolean;
    suggestion_generation: boolean;
    pattern_detection: boolean;
    coaching_insights: boolean;
  };
  thresholds: {
    min_messages_for_analysis: number;
    quality_alert_threshold: number;
    response_time_alert_threshold: number;
    frustration_keywords: string[];
  };
  ai_provider: 'openai' | 'gemini' | 'groq';
  model_preferences: {
    quality_analysis: string;
    suggestion_generation: string;
    pattern_detection: string;
  };
}

// Utilitário para criar configurações padrão

export const DEFAULT_ASSISTANT_SETTINGS: Omit<AssistantSettings, 'id' | 'user_id' | 'company_id' | 'created_at' | 'updated_at'> = {
  is_enabled: true,
  position: 'bottom-left',
  notification_level: 'all',
  alert_slow_response: true,
  alert_quality_issues: true,
  alert_customer_frustration: true,
  alert_forgotten_conversations: true,
  slow_response_threshold: 300, // 5 minutos
  quality_threshold: 70,
  show_response_suggestions: true,
  show_action_suggestions: true,
  show_coaching_tips: true,
};

// Utilitários de cores para scores

export function getScoreColor(score: number | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (score === null) return 'gray';
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'urgent': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}

export function getLoadColor(load: LoadLevel | null): string {
  switch (load) {
    case 'overloaded': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}

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

export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}
