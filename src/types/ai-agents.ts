// =====================================================
// TIPOS DO SISTEMA DE AGENTES DE IA
// MelonChat - Sistema Robusto de Agentes de Atendimento
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export type AIAgentType =
  | 'customer_service'    // Atendimento ao cliente
  | 'sales'               // Vendas
  | 'support'             // Suporte técnico
  | 'qualification'       // Qualificação de leads
  | 'scheduling'          // Agendamentos
  | 'faq'                 // FAQ e informações
  | 'custom';             // Personalizado

export type AIAgentStatus =
  | 'draft'               // Rascunho - não publicado
  | 'active'              // Ativo e atendendo
  | 'paused'              // Pausado temporariamente
  | 'training'            // Em treinamento/aprendizado
  | 'archived';           // Arquivado

export type AIAgentAutonomy =
  | 'full'                // 100% autônomo - responde sozinho
  | 'supervised'          // Responde mas notifica humano
  | 'assisted'            // Sugere respostas para humano aprovar
  | 'handoff_only';       // Apenas coleta info e passa para humano

export type AIHandoffBehavior =
  | 'immediate'           // Passa imediatamente quando solicitado
  | 'after_qualification' // Passa após qualificar
  | 'on_frustration'      // Passa quando detecta frustração
  | 'on_complexity'       // Passa quando não sabe responder
  | 'never';              // Nunca passa (com fallback definido)

export type AIPersonalityStyle =
  | 'professional'        // Formal e profissional
  | 'friendly'            // Amigável e casual
  | 'empathetic'          // Empático e compreensivo
  | 'direct'              // Direto e objetivo
  | 'enthusiastic'        // Entusiasmado e animado
  | 'consultative'        // Consultivo e educador
  | 'custom';             // Personalizado via prompt

export type AIFallbackType =
  | 'apologize_handoff'   // Pede desculpas e passa para humano
  | 'ask_rephrase'        // Pede para reformular
  | 'offer_options'       // Oferece opções de menu
  | 'collect_contact'     // Coleta contato para retorno
  | 'schedule_callback'   // Agenda retorno
  | 'custom_message';     // Mensagem customizada

export type AITriggerType =
  | 'always'              // Sempre ativo
  | 'keyword'             // Por palavras-chave
  | 'schedule'            // Por horário
  | 'channel'             // Por canal específico
  | 'tag'                 // Por tag do contato
  | 'no_agent_available'  // Quando não há agente disponível
  | 'after_hours'         // Fora do horário comercial
  | 'queue_threshold'     // Quando fila atinge limite
  | 'manual';             // Ativação manual apenas

export type AISessionStatus =
  | 'active'              // Em andamento
  | 'waiting_response'    // Aguardando resposta do cliente
  | 'handed_off'          // Transferido para humano
  | 'completed'           // Finalizado com sucesso
  | 'abandoned'           // Abandonado pelo cliente
  | 'failed';             // Falhou (erro ou timeout)

export type AIActionType =
  | 'send_message'        // Enviar mensagem
  | 'ask_question'        // Fazer pergunta
  | 'collect_data'        // Coletar dados
  | 'qualify_lead'        // Qualificar lead
  | 'schedule_meeting'    // Agendar reunião
  | 'create_deal'         // Criar negócio
  | 'create_task'         // Criar tarefa
  | 'add_tag'             // Adicionar tag
  | 'update_contact'      // Atualizar contato
  | 'send_media'          // Enviar mídia
  | 'handoff'             // Transferir para humano
  | 'escalate'            // Escalar para supervisor
  | 'end_conversation'    // Encerrar conversa
  | 'webhook'             // Chamar webhook externo
  | 'custom_code';        // Executar código customizado

// =====================================================
// INTERFACES PRINCIPAIS
// =====================================================

export interface AIAgent {
  id: string;
  company_id: string;
  created_by?: string;

  // Identificação
  name: string;
  description?: string;
  avatar_url?: string;
  display_name?: string;

  // Classificação
  agent_type: AIAgentType;
  status: AIAgentStatus;
  version: number;

  // Configurações de autonomia
  autonomy_level: AIAgentAutonomy;
  handoff_behavior: AIHandoffBehavior;
  confidence_threshold: number;

  // Configurações de personalidade
  personality_style: AIPersonalityStyle;
  custom_personality?: string;
  language: string;
  tone_formality: number;
  use_emojis: boolean;
  max_emoji_per_message?: number;

  // Prompt principal
  system_prompt: string;

  // Conhecimento e contexto
  knowledge_base: KnowledgeBaseItem[];
  product_catalog_enabled: boolean;
  crm_context_enabled: boolean;
  conversation_history_limit: number;

  // Configurações de resposta
  max_response_length: number;
  min_response_length: number;
  response_delay_ms: number;
  typing_indicator: boolean;

  // Fallbacks
  fallback_type: AIFallbackType;
  fallback_message?: string;
  fallback_agent_id?: string;

  // Limites e proteções
  max_messages_per_session: number;
  session_timeout_minutes: number;
  daily_message_limit: number;
  rate_limit_per_minute: number;

  // Horários de funcionamento
  schedule_enabled: boolean;
  schedule: AgentSchedule;
  out_of_hours_message?: string;

  // Métricas
  total_sessions: number;
  total_messages_sent: number;
  total_handoffs: number;
  avg_session_duration: number;
  avg_messages_per_session: number;
  satisfaction_score: number;
  resolution_rate: number;

  // Configurações avançadas
  settings: AgentAdvancedSettings;
  metadata: Record<string, unknown>;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  last_active_at?: string;

  // Relações expandidas
  channels?: AIAgentChannel[];
  skills?: AIAgentSkill[];
  flows?: AIAgentFlow[];
}

export interface KnowledgeBaseItem {
  id: string;
  type: 'faq' | 'document' | 'product' | 'policy';
  title: string;
  content: string;
  tags?: string[];
}

export interface AgentSchedule {
  timezone?: string;
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "18:00"
  break_start?: string;
  break_end?: string;
}

export interface AgentAdvancedSettings {
  // Detecção de intenções
  intent_detection_enabled?: boolean;
  custom_intents?: CustomIntent[];

  // Sentimento
  sentiment_detection_enabled?: boolean;
  frustration_threshold?: number;

  // Contexto
  use_contact_history?: boolean;
  use_deal_context?: boolean;
  use_company_variables?: boolean;

  // Respostas
  allow_links?: boolean;
  allow_media?: boolean;
  allow_lists?: boolean;
  allow_buttons?: boolean;

  // Segurança
  block_sensitive_data?: boolean;
  sensitive_patterns?: string[];

  // Debug
  debug_mode?: boolean;
  log_all_responses?: boolean;
}

export interface CustomIntent {
  name: string;
  keywords: string[];
  patterns?: string[];
  priority: number;
}

// =====================================================
// CANAIS DO AGENTE
// =====================================================

export interface AIAgentChannel {
  id: string;
  agent_id: string;
  channel_id: string;
  company_id: string;

  is_enabled: boolean;
  priority: number;

  trigger_type: AITriggerType;
  trigger_config: TriggerConfig;

  welcome_message?: string;
  channel_specific_prompt?: string;

  total_sessions: number;
  total_messages: number;

  created_at: string;
  updated_at: string;

  // Relação expandida
  channel?: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
}

export interface TriggerConfig {
  keywords?: string[];
  schedule?: AgentSchedule;
  tags?: string[];
  queue_threshold?: number;
  custom_conditions?: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than';
  value: string | number;
}

// =====================================================
// SKILLS DO AGENTE
// =====================================================

export interface AIAgentSkill {
  id: string;
  agent_id: string;
  company_id: string;

  skill_name: string;
  skill_type: SkillType;
  description?: string;

  is_enabled: boolean;
  priority: number;

  trigger_keywords: string[];
  trigger_intents: string[];
  trigger_patterns: string[];

  actions: SkillAction[];
  conditions: SkillCondition[];
  responses: SkillResponse[];

  times_triggered: number;
  success_rate: number;

  created_at: string;
  updated_at: string;
}

export type SkillType =
  | 'greeting'
  | 'farewell'
  | 'faq'
  | 'product_info'
  | 'pricing'
  | 'scheduling'
  | 'qualification'
  | 'complaint'
  | 'support'
  | 'feedback'
  | 'custom';

export interface SkillAction {
  type: AIActionType;
  config: Record<string, unknown>;
  order: number;
}

export interface SkillCondition {
  type: 'intent' | 'sentiment' | 'keyword' | 'tag' | 'variable' | 'time';
  operator: 'equals' | 'contains' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[];
}

export interface SkillResponse {
  template: string;
  variations?: string[];
  conditions?: SkillCondition[];
  weight?: number; // Para seleção aleatória ponderada
}

// =====================================================
// KNOWLEDGE BASE
// =====================================================

export interface AIAgentKnowledge {
  id: string;
  agent_id: string;
  company_id: string;

  knowledge_type: 'faq' | 'document' | 'product' | 'policy' | 'script';

  title: string;
  content: string;
  summary?: string;

  category?: string;
  tags: string[];

  priority: number;
  relevance_score: number;

  is_enabled: boolean;
  use_in_training: boolean;

  source_url?: string;
  source_file?: string;
  metadata: Record<string, unknown>;

  times_used: number;
  helpful_votes: number;

  created_at: string;
  updated_at: string;
}

// =====================================================
// FLUXOS DO AGENTE
// =====================================================

export interface AIAgentFlow {
  id: string;
  agent_id: string;
  company_id: string;

  name: string;
  description?: string;
  flow_type: FlowType;

  is_enabled: boolean;
  is_default: boolean;

  trigger_keywords: string[];
  trigger_intents: string[];
  trigger_conditions: TriggerCondition[];

  nodes: FlowNode[];
  edges: FlowEdge[];
  variables: FlowVariable[];

  settings: FlowSettings;

  times_started: number;
  times_completed: number;
  avg_completion_rate: number;

  created_at: string;
  updated_at: string;
}

export type FlowType =
  | 'qualification'
  | 'support'
  | 'sales'
  | 'onboarding'
  | 'survey'
  | 'scheduling'
  | 'feedback'
  | 'custom';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export type FlowNodeType =
  | 'start'
  | 'message'
  | 'question'
  | 'condition'
  | 'action'
  | 'ai_response'
  | 'handoff'
  | 'delay'
  | 'end';

export interface FlowNodeData {
  label?: string;
  message?: string;
  question?: string;
  options?: FlowOption[];
  action?: SkillAction;
  condition?: FlowConditionConfig;
  ai_prompt?: string;
  delay_ms?: number;
  variable?: string;
  validation?: ValidationRule;
  [key: string]: unknown;
}

export interface FlowOption {
  id: string;
  label: string;
  value: string;
  next_node_id?: string;
}

export interface FlowConditionConfig {
  type: 'variable' | 'intent' | 'sentiment' | 'response';
  rules: ConditionRule[];
  default_branch?: string;
}

export interface ConditionRule {
  id: string;
  field?: string;
  operator: string;
  value: string | number;
  next_node_id: string;
}

export interface ValidationRule {
  type: 'email' | 'phone' | 'cpf' | 'cnpj' | 'date' | 'number' | 'text' | 'regex';
  pattern?: string;
  min_length?: number;
  max_length?: number;
  error_message?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default_value?: unknown;
  description?: string;
}

export interface FlowSettings {
  timeout_ms?: number;
  max_retries?: number;
  save_to_contact?: boolean;
  notify_on_complete?: boolean;
}

// =====================================================
// SESSÕES
// =====================================================

export interface AIAgentSession {
  id: string;
  agent_id: string;
  conversation_id: string;
  contact_id: string;
  channel_id?: string;
  company_id: string;

  status: AISessionStatus;

  current_flow_id?: string;
  current_node_id?: string;
  flow_variables: Record<string, unknown>;

  context: SessionContext;
  collected_data: Record<string, unknown>;
  intent_history: string[];
  sentiment_history: string[];

  messages_sent: number;
  messages_received: number;
  avg_response_time: number;
  confidence_scores: number[];

  handed_off_to?: string;
  handoff_reason?: string;
  handoff_at?: string;

  customer_rating?: number;
  customer_feedback?: string;
  internal_quality_score?: number;

  started_at: string;
  last_activity_at: string;
  ended_at?: string;

  metadata: Record<string, unknown>;

  // Relações expandidas
  agent?: AIAgent;
  contact?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface SessionContext {
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_tags?: string[];
  deal_stage?: string;
  deal_value?: number;
  previous_sessions?: number;
  last_interaction?: string;
  custom_fields?: Record<string, unknown>;
}

// =====================================================
// LOGS DE AÇÃO
// =====================================================

export interface AIAgentActionLog {
  id: string;
  session_id: string;
  agent_id: string;
  company_id: string;

  action_type: AIActionType;
  action_name?: string;

  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;

  detected_intent?: string;
  detected_sentiment?: string;
  confidence_score?: number;

  skill_id?: string;
  flow_id?: string;
  node_id?: string;

  success: boolean;
  error_message?: string;

  processing_time_ms?: number;
  tokens_used?: number;

  created_at: string;
}

// =====================================================
// TEMPLATES DE RESPOSTA
// =====================================================

export interface AIAgentResponseTemplate {
  id: string;
  agent_id?: string;
  company_id: string;

  name: string;
  category: TemplateCategory;

  content: string;
  variations: string[];

  variables: string[];
  conditions: SkillCondition[];

  is_enabled: boolean;
  priority: number;

  times_used: number;

  created_at: string;
  updated_at: string;
}

export type TemplateCategory =
  | 'greeting'
  | 'farewell'
  | 'apologize'
  | 'confirm'
  | 'thank'
  | 'wait'
  | 'clarify'
  | 'handoff'
  | 'error'
  | 'custom';

// =====================================================
// REGRAS DE HANDOFF
// =====================================================

export interface AIAgentHandoffRule {
  id: string;
  agent_id: string;
  company_id: string;

  name: string;
  description?: string;

  priority: number;
  is_enabled: boolean;

  conditions: HandoffCondition[];

  target_type: 'queue' | 'specific_agent' | 'team' | 'round_robin';
  target_id?: string;
  target_queue?: string;

  pre_handoff_message?: string;
  handoff_message?: string;

  collect_data_before: boolean;
  data_to_collect: DataField[];

  include_conversation_summary: boolean;
  include_collected_data: boolean;
  include_sentiment_history: boolean;

  times_triggered: number;

  created_at: string;
  updated_at: string;
}

export interface HandoffCondition {
  type: 'keyword' | 'sentiment' | 'confidence' | 'messages_count' | 'intent' | 'time' | 'custom';
  operator?: 'equals' | 'contains' | 'less_than' | 'greater_than' | 'in';
  value: string | number | string[];
  consecutive?: number; // Para condições consecutivas
}

export interface DataField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select';
  label: string;
  required: boolean;
  options?: string[];
  validation?: ValidationRule;
}

// =====================================================
// TREINAMENTO
// =====================================================

export interface AIAgentTrainingData {
  id: string;
  agent_id: string;
  company_id: string;

  data_type: 'example' | 'correction' | 'feedback' | 'conversation';

  input_text: string;
  expected_output?: string;
  actual_output?: string;

  is_correct?: boolean;
  correction?: string;
  feedback_notes?: string;

  source_session_id?: string;
  source_message_id?: string;
  reviewed_by?: string;

  used_in_training: boolean;
  training_batch_id?: string;

  created_at: string;
  reviewed_at?: string;
}

// =====================================================
// MÉTRICAS
// =====================================================

export interface AIAgentMetrics {
  id: string;
  agent_id: string;
  company_id: string;

  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;

  // Volume
  total_sessions: number;
  total_messages_sent: number;
  total_messages_received: number;
  unique_contacts: number;

  // Qualidade
  avg_confidence_score?: number;
  avg_response_time_ms?: number;
  avg_session_duration_seconds?: number;
  avg_messages_per_session?: number;

  // Resolução
  sessions_completed: number;
  sessions_handed_off: number;
  sessions_abandoned: number;
  sessions_failed: number;
  resolution_rate?: number;

  // Satisfação
  ratings_count: number;
  avg_rating?: number;
  positive_ratings: number;
  negative_ratings: number;

  // Intenções
  top_intents: IntentMetric[];

  // Skills
  skill_usage: Record<string, number>;

  // Erros
  errors_count: number;
  error_types: Record<string, number>;

  created_at: string;
}

export interface IntentMetric {
  intent: string;
  count: number;
  percentage: number;
}

// =====================================================
// VERSÕES
// =====================================================

export interface AIAgentVersion {
  id: string;
  agent_id: string;
  company_id: string;

  version_number: number;
  version_name?: string;

  agent_snapshot: AIAgent;

  changes_summary?: string;
  changed_by?: string;

  is_published: boolean;
  published_at?: string;
  published_by?: string;

  sessions_count: number;
  avg_rating?: number;

  created_at: string;
}

// =====================================================
// A/B TESTING
// =====================================================

export interface AIAgentABTest {
  id: string;
  company_id: string;

  name: string;
  description?: string;

  variant_a_agent_id: string;
  variant_b_agent_id: string;
  traffic_split: number;

  start_at: string;
  end_at?: string;

  status: 'draft' | 'running' | 'paused' | 'completed';

  primary_metric: 'resolution_rate' | 'satisfaction' | 'response_time' | 'handoff_rate';

  results: ABTestResults;
  winner_variant?: 'A' | 'B';
  statistical_significance?: number;

  created_at: string;
  updated_at: string;

  // Relações expandidas
  variant_a?: AIAgent;
  variant_b?: AIAgent;
}

export interface ABTestResults {
  variant_a: ABTestVariantResult;
  variant_b: ABTestVariantResult;
}

export interface ABTestVariantResult {
  sessions: number;
  resolution_rate: number;
  avg_satisfaction: number;
  avg_response_time: number;
  handoff_rate: number;
}

// =====================================================
// INTEGRAÇÕES
// =====================================================

export interface AIAgentIntegration {
  id: string;
  agent_id: string;
  company_id: string;

  integration_type: 'webhook' | 'api' | 'calendar' | 'crm' | 'ecommerce';
  integration_name: string;

  is_enabled: boolean;
  config: IntegrationConfig;

  webhook_url?: string;
  api_base_url?: string;

  data_mapping: Record<string, string>;

  last_sync_at?: string;
  last_error?: string;
  error_count: number;

  created_at: string;
  updated_at: string;
}

export interface IntegrationConfig {
  auth_type?: 'api_key' | 'oauth' | 'bearer' | 'basic';
  headers?: Record<string, string>;
  timeout_ms?: number;
  retry_count?: number;
  [key: string]: unknown;
}

// =====================================================
// FORMULÁRIOS DE CRIAÇÃO/EDIÇÃO
// =====================================================

export interface AIAgentFormData {
  // Básico
  name: string;
  description?: string;
  avatar_url?: string;
  display_name?: string;
  agent_type: AIAgentType;

  // Autonomia
  autonomy_level: AIAgentAutonomy;
  handoff_behavior: AIHandoffBehavior;
  confidence_threshold: number;

  // Personalidade
  personality_style: AIPersonalityStyle;
  custom_personality?: string;
  language: string;
  tone_formality: number;
  use_emojis: boolean;

  // Prompt
  system_prompt: string;

  // Contexto
  crm_context_enabled: boolean;
  conversation_history_limit: number;

  // Resposta
  max_response_length: number;
  response_delay_ms: number;
  typing_indicator: boolean;

  // Fallback
  fallback_type: AIFallbackType;
  fallback_message?: string;
  fallback_agent_id?: string;

  // Limites
  max_messages_per_session: number;
  session_timeout_minutes: number;
  daily_message_limit: number;

  // Horários
  schedule_enabled: boolean;
  schedule?: AgentSchedule;
  out_of_hours_message?: string;

  // Configurações avançadas
  settings?: AgentAdvancedSettings;
}

// =====================================================
// CONSTANTES E DEFAULTS
// =====================================================

export const AI_AGENT_TYPE_LABELS: Record<AIAgentType, string> = {
  customer_service: 'Atendimento ao Cliente',
  sales: 'Vendas',
  support: 'Suporte Técnico',
  qualification: 'Qualificação de Leads',
  scheduling: 'Agendamentos',
  faq: 'FAQ e Informações',
  custom: 'Personalizado',
};

export const AI_AGENT_STATUS_LABELS: Record<AIAgentStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  paused: 'Pausado',
  training: 'Em Treinamento',
  archived: 'Arquivado',
};

export const AI_AUTONOMY_LABELS: Record<AIAgentAutonomy, string> = {
  full: 'Totalmente Autônomo',
  supervised: 'Supervisionado',
  assisted: 'Assistido',
  handoff_only: 'Apenas Handoff',
};

export const AI_PERSONALITY_LABELS: Record<AIPersonalityStyle, string> = {
  professional: 'Profissional',
  friendly: 'Amigável',
  empathetic: 'Empático',
  direct: 'Direto',
  enthusiastic: 'Entusiasmado',
  consultative: 'Consultivo',
  custom: 'Personalizado',
};

export const AI_HANDOFF_LABELS: Record<AIHandoffBehavior, string> = {
  immediate: 'Imediato',
  after_qualification: 'Após Qualificação',
  on_frustration: 'Ao Detectar Frustração',
  on_complexity: 'Quando Não Souber',
  never: 'Nunca',
};

export const AI_FALLBACK_LABELS: Record<AIFallbackType, string> = {
  apologize_handoff: 'Pedir Desculpas e Transferir',
  ask_rephrase: 'Pedir para Reformular',
  offer_options: 'Oferecer Opções',
  collect_contact: 'Coletar Contato',
  schedule_callback: 'Agendar Retorno',
  custom_message: 'Mensagem Customizada',
};

export const DEFAULT_AI_AGENT: Partial<AIAgentFormData> = {
  agent_type: 'customer_service',
  autonomy_level: 'supervised',
  handoff_behavior: 'on_complexity',
  confidence_threshold: 0.75,
  personality_style: 'professional',
  language: 'pt-BR',
  tone_formality: 7,
  use_emojis: false,
  crm_context_enabled: true,
  conversation_history_limit: 20,
  max_response_length: 500,
  response_delay_ms: 1500,
  typing_indicator: true,
  fallback_type: 'apologize_handoff',
  max_messages_per_session: 50,
  session_timeout_minutes: 30,
  daily_message_limit: 1000,
  schedule_enabled: false,
  system_prompt: `Você é um assistente virtual profissional e prestativo.

Suas diretrizes:
- Seja sempre educado e prestativo
- Responda de forma clara e objetiva
- Se não souber algo, admita e ofereça alternativas
- Mantenha o contexto da conversa
- Priorize a satisfação do cliente

Lembre-se de:
- Usar o nome do cliente quando disponível
- Confirmar informações importantes
- Oferecer próximos passos claros`,
};

// =====================================================
// HELPERS
// =====================================================

export function getAgentStatusColor(status: AIAgentStatus): string {
  const colors: Record<AIAgentStatus, string> = {
    draft: 'gray',
    active: 'green',
    paused: 'yellow',
    training: 'blue',
    archived: 'red',
  };
  return colors[status];
}

export function getSessionStatusColor(status: AISessionStatus): string {
  const colors: Record<AISessionStatus, string> = {
    active: 'green',
    waiting_response: 'yellow',
    handed_off: 'blue',
    completed: 'gray',
    abandoned: 'orange',
    failed: 'red',
  };
  return colors[status];
}

export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function getAutonomyDescription(level: AIAgentAutonomy): string {
  const descriptions: Record<AIAgentAutonomy, string> = {
    full: 'O agente responde automaticamente sem supervisão',
    supervised: 'O agente responde mas notifica um humano',
    assisted: 'O agente sugere respostas para aprovação',
    handoff_only: 'O agente coleta informações e passa para humano',
  };
  return descriptions[level];
}
