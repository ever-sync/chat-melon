// =====================================================
// Types for Visual Chatbot Builder - World's Best Edition
// =====================================================

import type { Node, Edge } from 'reactflow';

// =====================================================
// Node Types - Expanded with Advanced Features
// =====================================================

export type ChatbotNodeType =
  // Flow Control
  | 'start'
  | 'end'
  | 'delay'
  | 'goto'
  | 'split'
  // Basic Interaction
  | 'message'
  | 'question'
  | 'menu'
  // Advanced Interaction
  | 'carousel'
  | 'list'
  | 'quick_reply'
  | 'file_upload'
  | 'location'
  | 'contact_card'
  | 'rating'
  | 'nps'
  | 'calendar'
  // Logic & Conditions
  | 'condition'
  | 'switch'
  | 'ab_test'
  | 'random'
  | 'time_condition'
  | 'set_variable'
  | 'math_operation'
  | 'format_text'
  // Actions
  | 'action'
  | 'handoff'
  | 'send_email'
  | 'send_sms'
  | 'create_deal'
  | 'update_contact'
  | 'add_tag'
  | 'remove_tag'
  | 'schedule_message'
  // AI & Intelligence
  | 'ai_response'
  | 'ai_classifier'
  | 'ai_sentiment'
  | 'ai_extract'
  | 'ai_summarize'
  | 'ai_translate'
  // Integrations
  | 'webhook'
  | 'http_request'
  | 'google_sheets'
  | 'zapier'
  | 'custom_code'
  // E-commerce
  | 'product_catalog'
  | 'cart'
  | 'payment'
  | 'order_status'
  // Multimedia
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker';

// Base data for all nodes
export interface BaseNodeData {
  label?: string;
  notes?: string;
  color?: string;
}

// =====================================================
// Flow Control Nodes
// =====================================================

export interface StartNodeData extends BaseNodeData {
  label: string;
  triggerType?: 'keyword' | 'first_message' | 'webhook' | 'all_messages' | 'schedule' | 'button' | 'qr_code';
  triggerKeywords?: string;
  welcomeDelay?: number;
}

export interface EndNodeData extends BaseNodeData {
  closeConversation?: boolean;
  endMessage?: string;
  feedback?: boolean;
  redirectTo?: string;
}

export interface DelayNodeData extends BaseNodeData {
  delayType: 'fixed' | 'typing' | 'random' | 'smart';
  delayMs: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  showTypingIndicator?: boolean;
}

export interface GotoNodeData extends BaseNodeData {
  targetNodeId: string;
  targetFlowId?: string;
}

export interface SplitNodeData extends BaseNodeData {
  branches: { id: string; name: string; percentage: number; color?: string }[];
  trackingEnabled?: boolean;
}

// =====================================================
// Interaction Nodes
// =====================================================

export interface MessageNodeData extends BaseNodeData {
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  buttons?: MessageButton[];
  formatting?: { bold?: boolean; italic?: boolean; monospace?: boolean };
  previewUrl?: boolean;
}

export interface MessageButton {
  id: string;
  label: string;
  action: 'url' | 'next_node' | 'phone' | 'copy' | 'share';
  value: string;
  emoji?: string;
}

export type ValidationRule =
  | 'text' | 'email' | 'phone' | 'number' | 'integer' | 'decimal'
  | 'date' | 'time' | 'datetime' | 'cpf' | 'cnpj' | 'cep' | 'url' | 'custom';

export interface QuestionNodeData extends BaseNodeData {
  question: string;
  variableName: string;
  validation?: ValidationRule;
  customValidationRegex?: string;
  errorMessage?: string;
  maxRetries?: number;
  retryMessage?: string;
  skipOption?: boolean;
  skipText?: string;
  timeout?: number;
  timeoutAction?: 'retry' | 'skip' | 'handoff' | 'end';
  placeholder?: string;
  suggestions?: string[];
}

export interface MenuNodeData extends BaseNodeData {
  title: string;
  subtitle?: string;
  options: MenuOption[];
  allowTypedResponse?: boolean;
  allowMultiple?: boolean;
  minSelections?: number;
  maxSelections?: number;
  invalidOptionMessage?: string;
  displayStyle?: 'list' | 'buttons' | 'inline';
  columns?: 1 | 2 | 3;
}

export interface MenuOption {
  id: string;
  label: string;
  value: string;
  emoji?: string;
  description?: string;
  imageUrl?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CarouselNodeData extends BaseNodeData {
  title?: string;
  cards: CarouselCard[];
  scrollable?: boolean;
}

export interface CarouselCard {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons: MessageButton[];
  price?: number;
  originalPrice?: number;
  badge?: string;
}

export interface ListNodeData extends BaseNodeData {
  title: string;
  subtitle?: string;
  buttonText: string;
  sections: ListSection[];
}

export interface ListSection {
  id: string;
  title: string;
  items: ListItem[];
}

export interface ListItem {
  id: string;
  title: string;
  description?: string;
  value: string;
}

export interface QuickReplyNodeData extends BaseNodeData {
  message: string;
  replies: QuickReply[];
  variableName?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
  emoji?: string;
}

export interface FileUploadNodeData extends BaseNodeData {
  prompt: string;
  allowedTypes: ('image' | 'video' | 'audio' | 'document' | 'any')[];
  maxSizeMb?: number;
  variableName: string;
  required?: boolean;
}

export interface LocationNodeData extends BaseNodeData {
  requestType: 'request' | 'send';
  prompt?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  variableName?: string;
}

export interface ContactCardNodeData extends BaseNodeData {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  title?: string;
  website?: string;
  address?: string;
}

export interface RatingNodeData extends BaseNodeData {
  question: string;
  ratingType: 'stars' | 'numbers' | 'emoji' | 'thumbs';
  maxRating: number;
  variableName: string;
  labels?: { value: number; label: string }[];
  followUpQuestion?: string;
  lowRatingThreshold?: number;
  lowRatingAction?: 'handoff' | 'special_flow' | 'continue';
}

export interface NPSNodeData extends BaseNodeData {
  question: string;
  variableName: string;
  followUpDetractor?: string;
  followUpPassive?: string;
  followUpPromoter?: string;
  collectFeedback?: boolean;
}

export interface CalendarNodeData extends BaseNodeData {
  prompt: string;
  calendarType: 'google' | 'calendly' | 'custom';
  calendarId?: string;
  slotDuration?: number;
  availableDays?: number[];
  startHour?: number;
  endHour?: number;
  timezone?: string;
  variableName: string;
  bufferTime?: number;
}

// =====================================================
// Logic Nodes
// =====================================================

export interface ConditionNodeData extends BaseNodeData {
  conditions: Condition[];
  defaultBranch?: string;
  logicOperator?: 'and' | 'or';
}

export interface Condition {
  id: string;
  variable: string;
  operator: ConditionOperator;
  value: string;
  valueType?: 'static' | 'variable';
  targetNodeId?: string;
}

export type ConditionOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with' | 'greater' | 'greater_equal'
  | 'less' | 'less_equal' | 'regex' | 'exists' | 'not_exists'
  | 'is_empty' | 'is_not_empty' | 'in_list' | 'not_in_list' | 'is_type';

export interface SwitchNodeData extends BaseNodeData {
  variable: string;
  cases: SwitchCase[];
  defaultCase?: string;
}

export interface SwitchCase {
  id: string;
  value: string;
  label?: string;
}

export interface ABTestNodeData extends BaseNodeData {
  testName: string;
  variants: ABVariant[];
  trackingEvent?: string;
}

export interface ABVariant {
  id: string;
  name: string;
  weight: number;
}

export interface RandomNodeData extends BaseNodeData {
  outputs: { id: string; label: string; weight: number }[];
}

export interface TimeConditionNodeData extends BaseNodeData {
  conditions: TimeCondition[];
  timezone?: string;
}

export interface TimeCondition {
  id: string;
  type: 'hour' | 'day' | 'date' | 'business_hours';
  startHour?: number;
  endHour?: number;
  days?: number[];
  startDate?: string;
  endDate?: string;
}

export interface SetVariableNodeData extends BaseNodeData {
  variableName: string;
  valueType: 'static' | 'expression' | 'from_response' | 'from_api' | 'random' | 'timestamp' | 'increment';
  value: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'capitalize' | 'slug';
}

export interface MathOperationNodeData extends BaseNodeData {
  resultVariable: string;
  expression: string;
  precision?: number;
}

export interface FormatTextNodeData extends BaseNodeData {
  template: string;
  resultVariable: string;
  format?: 'plain' | 'markdown' | 'html';
}

// =====================================================
// Action Nodes
// =====================================================

export interface ActionNodeData extends BaseNodeData {
  actionType:
    | 'tag_contact' | 'assign_agent' | 'assign_team' | 'update_contact'
    | 'send_email' | 'create_ticket' | 'create_task' | 'add_note' | 'trigger_automation';
  config: Record<string, unknown>;
}

export interface HandoffNodeData extends BaseNodeData {
  message?: string;
  teamId?: string;
  agentId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  transferNote?: string;
  preserveContext?: boolean;
  waitForAgent?: boolean;
  offlineMessage?: string;
  skills?: string[];
}

export interface SendEmailNodeData extends BaseNodeData {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: string[];
  cc?: string;
  bcc?: string;
  replyTo?: string;
}

export interface SendSMSNodeData extends BaseNodeData {
  to: string;
  message: string;
  provider?: string;
}

export interface CreateDealNodeData extends BaseNodeData {
  pipelineId?: string;
  stageId?: string;
  title: string;
  value?: number;
  customFields?: Record<string, string>;
}

export interface UpdateContactNodeData extends BaseNodeData {
  fields: { field: string; value: string }[];
  createIfNotExists?: boolean;
}

export interface AddTagNodeData extends BaseNodeData {
  tags: string[];
  tagIds?: string[];
}

export interface RemoveTagNodeData extends BaseNodeData {
  tags: string[];
  tagIds?: string[];
}

export interface ScheduleMessageNodeData extends BaseNodeData {
  message: string;
  scheduleType: 'delay' | 'specific_time' | 'next_business_day';
  delayMinutes?: number;
  scheduledTime?: string;
  timezone?: string;
}

// =====================================================
// AI Nodes
// =====================================================

export interface AIResponseNodeData extends BaseNodeData {
  model?: 'gpt-4' | 'gpt-3.5' | 'claude' | 'gemini' | 'groq';
  systemPrompt?: string;
  userPromptTemplate?: string;
  useKnowledgeBase?: boolean;
  knowledgeBaseIds?: string[];
  useConversationHistory?: boolean;
  historyMessages?: number;
  temperature?: number;
  maxTokens?: number;
  fallbackMessage?: string;
  saveToVariable?: string;
  streamResponse?: boolean;
  responseFormat?: 'text' | 'json' | 'structured';
  functions?: AIFunction[];
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  targetNodeId?: string;
}

export interface AIClassifierNodeData extends BaseNodeData {
  inputVariable: string;
  categories: AICategory[];
  model?: string;
  confidenceThreshold?: number;
  multiLabel?: boolean;
}

export interface AICategory {
  id: string;
  name: string;
  description: string;
  examples?: string[];
  targetNodeId?: string;
}

export interface AISentimentNodeData extends BaseNodeData {
  inputVariable: string;
  resultVariable: string;
  actions?: { positive?: string; neutral?: string; negative?: string };
  threshold?: number;
}

export interface AIExtractNodeData extends BaseNodeData {
  inputVariable: string;
  extractions: AIExtraction[];
  model?: string;
}

export interface AIExtraction {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'json';
  required?: boolean;
  variableName: string;
}

export interface AISummarizeNodeData extends BaseNodeData {
  inputVariable: string;
  resultVariable: string;
  maxLength?: number;
  style?: 'bullets' | 'paragraph' | 'key_points';
}

export interface AITranslateNodeData extends BaseNodeData {
  inputVariable: string;
  resultVariable: string;
  targetLanguage: string;
  sourceLanguage?: string;
  preserveFormatting?: boolean;
}

// =====================================================
// Integration Nodes
// =====================================================

export interface WebhookNodeData extends BaseNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  bodyType?: 'json' | 'form' | 'raw';
  responseVariable?: string;
  responseMapping?: { path: string; variable: string }[];
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  authentication?: { type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2'; config: Record<string, string> };
  errorHandling?: { onError: 'continue' | 'retry' | 'fallback' | 'end'; fallbackNodeId?: string; errorVariable?: string };
}

export interface HTTPRequestNodeData extends BaseNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: string;
  responseVariable: string;
  expectedStatus?: number[];
}

export interface GoogleSheetsNodeData extends BaseNodeData {
  action: 'read' | 'append' | 'update' | 'search';
  spreadsheetId: string;
  sheetName: string;
  range?: string;
  data?: Record<string, string>;
  searchColumn?: string;
  searchValue?: string;
  resultVariable?: string;
}

export interface ZapierNodeData extends BaseNodeData {
  webhookUrl: string;
  data: Record<string, string>;
  waitForResponse?: boolean;
  responseVariable?: string;
}

export interface CustomCodeNodeData extends BaseNodeData {
  language: 'javascript' | 'python';
  code: string;
  inputs?: { name: string; variable: string }[];
  outputs?: { name: string; variable: string }[];
  timeout?: number;
}

// =====================================================
// E-commerce Nodes
// =====================================================

export interface ProductCatalogNodeData extends BaseNodeData {
  catalogId?: string;
  displayType: 'carousel' | 'list' | 'grid';
  filter?: Record<string, unknown>;
  sortBy?: string;
  limit?: number;
  showPrice?: boolean;
  showStock?: boolean;
  addToCartEnabled?: boolean;
}

export interface CartNodeData extends BaseNodeData {
  action: 'show' | 'add' | 'remove' | 'clear' | 'update_quantity';
  productVariable?: string;
  quantityVariable?: string;
  showSummary?: boolean;
}

export interface PaymentNodeData extends BaseNodeData {
  provider: 'stripe' | 'mercadopago' | 'pagseguro' | 'pix' | 'custom';
  amount?: string;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  successNodeId?: string;
  failureNodeId?: string;
  pixKey?: string;
  pixName?: string;
  expirationMinutes?: number;
}

export interface OrderStatusNodeData extends BaseNodeData {
  orderIdVariable: string;
  showDetails?: boolean;
  showTracking?: boolean;
  allowCancel?: boolean;
}

// =====================================================
// Multimedia Nodes
// =====================================================

export interface ImageNodeData extends BaseNodeData {
  url: string;
  caption?: string;
  altText?: string;
}

export interface VideoNodeData extends BaseNodeData {
  url: string;
  caption?: string;
  thumbnail?: string;
}

export interface AudioNodeData extends BaseNodeData {
  url: string;
  caption?: string;
  duration?: number;
}

export interface DocumentNodeData extends BaseNodeData {
  url: string;
  filename: string;
  caption?: string;
}

export interface StickerNodeData extends BaseNodeData {
  url: string;
  stickerId?: string;
}

// =====================================================
// Union type for all node data
// =====================================================

export type ChatbotNodeData =
  | StartNodeData | EndNodeData | DelayNodeData | GotoNodeData | SplitNodeData
  | MessageNodeData | QuestionNodeData | MenuNodeData | CarouselNodeData | ListNodeData
  | QuickReplyNodeData | FileUploadNodeData | LocationNodeData | ContactCardNodeData
  | RatingNodeData | NPSNodeData | CalendarNodeData
  | ConditionNodeData | SwitchNodeData | ABTestNodeData | RandomNodeData | TimeConditionNodeData
  | SetVariableNodeData | MathOperationNodeData | FormatTextNodeData
  | ActionNodeData | HandoffNodeData | SendEmailNodeData | SendSMSNodeData
  | CreateDealNodeData | UpdateContactNodeData | AddTagNodeData | RemoveTagNodeData | ScheduleMessageNodeData
  | AIResponseNodeData | AIClassifierNodeData | AISentimentNodeData | AIExtractNodeData
  | AISummarizeNodeData | AITranslateNodeData
  | WebhookNodeData | HTTPRequestNodeData | GoogleSheetsNodeData | ZapierNodeData | CustomCodeNodeData
  | ProductCatalogNodeData | CartNodeData | PaymentNodeData | OrderStatusNodeData
  | ImageNodeData | VideoNodeData | AudioNodeData | DocumentNodeData | StickerNodeData;

// Typed node for ReactFlow
export type ChatbotNode = Node<ChatbotNodeData, ChatbotNodeType>;
export type ChatbotEdge = Edge;

// =====================================================
// Chatbot Types
// =====================================================

export type ChatbotStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface ChatbotTrigger {
  id?: string;
  type: 'keyword' | 'first_message' | 'menu_option' | 'schedule' | 'manual' | 'button' | 'qr_code' | 'webhook';
  value?: string;
  keywords?: string[];
  channel?: string;
  schedule?: { days: number[]; startTime: string; endTime: string; timezone?: string };
  priority?: number;
  conditions?: Condition[];
}

export interface ChatbotSettings {
  typing_delay_ms: number;
  default_fallback_message: string;
  max_retries: number;
  session_timeout_minutes: number;
  track_analytics?: boolean;
  allow_restart?: boolean;
  restart_keywords?: string[];
  human_handoff_keywords?: string[];
  exit_keywords?: string[];
  default_language?: string;
  persist_variables?: boolean;
  debug_mode?: boolean;
  ai_settings?: { model: string; temperature: number; max_tokens: number; system_prompt?: string };
  notification_settings?: { notify_on_handoff: boolean; notify_on_error: boolean; notify_on_completion: boolean };
}

export interface ChatbotVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  defaultValue?: unknown;
  description?: string;
  scope: 'session' | 'contact' | 'global';
  persistent?: boolean;
}

export interface Chatbot {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
  variables: ChatbotVariable[] | Record<string, unknown>;
  settings: ChatbotSettings;
  triggers: ChatbotTrigger[];
  active_channels: string[];
  status: ChatbotStatus;
  version: number;
  published_at?: string;
  published_by?: string;
  total_executions: number;
  successful_completions: number;
  handoffs_count: number;
  avg_session_duration_seconds: number;
  avg_messages_per_session?: number;
  completion_rate?: number;
  satisfaction_score?: number;
  folder_id?: string;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatbotVersion {
  id: string;
  chatbot_id: string;
  version: number;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
  variables: ChatbotVariable[] | Record<string, unknown>;
  settings: ChatbotSettings;
  triggers: ChatbotTrigger[];
  published_by?: string;
  published_at: string;
  release_notes?: string;
  is_current?: boolean;
}

// =====================================================
// Execution Types
// =====================================================

export type ExecutionStatus =
  | 'running' | 'waiting_input' | 'waiting_payment' | 'waiting_calendar'
  | 'completed' | 'handoff' | 'failed' | 'timeout' | 'abandoned';

export interface ExecutionLogEntry {
  id?: string;
  node_id: string;
  type: ChatbotNodeType;
  timestamp: string;
  duration_ms?: number;
  content?: string;
  question?: string;
  answer?: string;
  ai_response?: string;
  api_response?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatbotExecution {
  id: string;
  chatbot_id: string;
  chatbot_version: number;
  conversation_id?: string;
  contact_id?: string;
  current_node_id?: string;
  previous_node_id?: string;
  status: ExecutionStatus;
  session_variables: Record<string, unknown>;
  execution_log: ExecutionLogEntry[];
  execution_path?: string[];
  messages_sent: number;
  messages_received: number;
  retry_count: number;
  started_at: string;
  last_interaction_at: string;
  completed_at?: string;
  handoff_at?: string;
  handoff_reason?: string;
  trigger_type?: string;
  trigger_value?: string;
  channel_type?: string;
  device_type?: string;
  browser?: string;
  location?: { country?: string; city?: string };
  ab_test_variants?: Record<string, string>;
  errors?: { node_id: string; error: string; timestamp: string }[];
}

// =====================================================
// Template Types
// =====================================================

export type TemplateCategory =
  | 'atendimento' | 'vendas' | 'suporte' | 'agendamento' | 'marketing'
  | 'onboarding' | 'feedback' | 'ecommerce' | 'lead_generation' | 'faq' | 'custom';

export interface ChatbotTemplate {
  id: string;
  name: string;
  description?: string;
  category?: TemplateCategory;
  subcategory?: string;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
  variables: ChatbotVariable[] | Record<string, unknown>;
  settings?: Partial<ChatbotSettings>;
  preview_image_url?: string;
  preview_gif_url?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_setup_time?: number;
  features?: string[];
  usage_count: number;
  rating?: number;
  reviews_count?: number;
  is_system: boolean;
  is_premium?: boolean;
  company_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// UI Helper Types
// =====================================================

export type NodeCategory =
  | 'flow' | 'interaction' | 'advanced_interaction' | 'logic'
  | 'action' | 'ai' | 'integration' | 'ecommerce' | 'multimedia';

export interface NodeTypeInfo {
  type: ChatbotNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: NodeCategory;
  defaultData: Partial<ChatbotNodeData>;
  isPremium?: boolean;
  isNew?: boolean;
  isBeta?: boolean;
  minConnections?: number;
  maxConnections?: number;
  allowedConnections?: ChatbotNodeType[];
  documentation?: string;
}

export const NODE_CATEGORIES: Record<NodeCategory, { label: string; icon: string; color: string }> = {
  flow: { label: 'Fluxo', icon: 'GitBranch', color: '#22C55E' },
  interaction: { label: 'Interação', icon: 'MessageSquare', color: '#3B82F6' },
  advanced_interaction: { label: 'Interação Avançada', icon: 'LayoutGrid', color: '#8B5CF6' },
  logic: { label: 'Lógica', icon: 'Settings', color: '#EC4899' },
  action: { label: 'Ações', icon: 'Zap', color: '#10B981' },
  ai: { label: 'Inteligência Artificial', icon: 'Sparkles', color: '#A855F7' },
  integration: { label: 'Integrações', icon: 'Globe', color: '#0EA5E9' },
  ecommerce: { label: 'E-commerce', icon: 'ShoppingCart', color: '#F59E0B' },
  multimedia: { label: 'Multimídia', icon: 'Image', color: '#6366F1' },
};

export const NODE_TYPE_INFO: Record<ChatbotNodeType, NodeTypeInfo> = {
  // Flow Control
  start: {
    type: 'start',
    label: 'Início',
    description: 'Ponto de entrada do fluxo',
    icon: 'Play',
    color: '#22C55E',
    category: 'flow',
    defaultData: { label: 'Início' },
  },
  end: {
    type: 'end',
    label: 'Fim',
    description: 'Finaliza o fluxo',
    icon: 'Square',
    color: '#64748B',
    category: 'flow',
    defaultData: { closeConversation: false },
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    description: 'Aguarda antes de continuar',
    icon: 'Clock',
    color: '#6B7280',
    category: 'flow',
    defaultData: { delayType: 'typing', delayMs: 1000, showTypingIndicator: true },
  },
  goto: {
    type: 'goto',
    label: 'Ir Para',
    description: 'Pula para outro nó ou fluxo',
    icon: 'CornerDownRight',
    color: '#6B7280',
    category: 'flow',
    defaultData: { targetNodeId: '' },
  },
  split: {
    type: 'split',
    label: 'Dividir Tráfego',
    description: 'Divide o tráfego em múltiplos caminhos',
    icon: 'Split',
    color: '#8B5CF6',
    category: 'flow',
    defaultData: { branches: [], trackingEnabled: true },
    isPremium: true,
  },

  // Basic Interaction
  message: {
    type: 'message',
    label: 'Mensagem',
    description: 'Envia uma mensagem ao usuário',
    icon: 'MessageSquare',
    color: '#3B82F6',
    category: 'interaction',
    defaultData: { content: '' },
  },
  question: {
    type: 'question',
    label: 'Pergunta',
    description: 'Faz uma pergunta e aguarda resposta',
    icon: 'HelpCircle',
    color: '#8B5CF6',
    category: 'interaction',
    defaultData: { question: '', variableName: '', validation: 'text' },
  },
  menu: {
    type: 'menu',
    label: 'Menu',
    description: 'Mostra opções para o usuário escolher',
    icon: 'List',
    color: '#F59E0B',
    category: 'interaction',
    defaultData: { title: '', options: [], displayStyle: 'buttons' },
  },

  // Advanced Interaction
  carousel: {
    type: 'carousel',
    label: 'Carrossel',
    description: 'Mostra cards deslizáveis com imagens',
    icon: 'LayoutGrid',
    color: '#8B5CF6',
    category: 'advanced_interaction',
    defaultData: { cards: [] },
    isNew: true,
  },
  list: {
    type: 'list',
    label: 'Lista',
    description: 'Mostra uma lista expandível de opções',
    icon: 'ListOrdered',
    color: '#8B5CF6',
    category: 'advanced_interaction',
    defaultData: { title: '', buttonText: 'Ver opções', sections: [] },
  },
  quick_reply: {
    type: 'quick_reply',
    label: 'Resposta Rápida',
    description: 'Botões de resposta rápida',
    icon: 'Zap',
    color: '#3B82F6',
    category: 'advanced_interaction',
    defaultData: { message: '', replies: [] },
  },
  file_upload: {
    type: 'file_upload',
    label: 'Upload de Arquivo',
    description: 'Solicita envio de arquivo',
    icon: 'Upload',
    color: '#6B7280',
    category: 'advanced_interaction',
    defaultData: { prompt: '', allowedTypes: ['any'], variableName: 'file' },
  },
  location: {
    type: 'location',
    label: 'Localização',
    description: 'Envia ou solicita localização',
    icon: 'MapPin',
    color: '#EF4444',
    category: 'advanced_interaction',
    defaultData: { requestType: 'request', prompt: 'Compartilhe sua localização' },
  },
  contact_card: {
    type: 'contact_card',
    label: 'Cartão de Contato',
    description: 'Envia um cartão de contato',
    icon: 'Contact',
    color: '#10B981',
    category: 'advanced_interaction',
    defaultData: { name: '', phone: '' },
  },
  rating: {
    type: 'rating',
    label: 'Avaliação',
    description: 'Solicita avaliação do usuário',
    icon: 'Star',
    color: '#F59E0B',
    category: 'advanced_interaction',
    defaultData: { question: 'Como você avalia nosso atendimento?', ratingType: 'stars', maxRating: 5, variableName: 'rating' },
    isNew: true,
  },
  nps: {
    type: 'nps',
    label: 'NPS',
    description: 'Pesquisa Net Promoter Score',
    icon: 'TrendingUp',
    color: '#10B981',
    category: 'advanced_interaction',
    defaultData: { question: 'De 0 a 10, qual a probabilidade de você nos recomendar?', variableName: 'nps_score' },
    isPremium: true,
  },
  calendar: {
    type: 'calendar',
    label: 'Agendamento',
    description: 'Permite agendar horário',
    icon: 'Calendar',
    color: '#3B82F6',
    category: 'advanced_interaction',
    defaultData: { prompt: 'Escolha um horário disponível', calendarType: 'custom', variableName: 'appointment' },
    isPremium: true,
  },

  // Logic
  condition: {
    type: 'condition',
    label: 'Condição',
    description: 'Ramifica o fluxo baseado em condições',
    icon: 'GitBranch',
    color: '#EC4899',
    category: 'logic',
    defaultData: { conditions: [], logicOperator: 'and' },
  },
  switch: {
    type: 'switch',
    label: 'Switch',
    description: 'Múltiplas ramificações por valor',
    icon: 'GitMerge',
    color: '#EC4899',
    category: 'logic',
    defaultData: { variable: '', cases: [] },
  },
  ab_test: {
    type: 'ab_test',
    label: 'Teste A/B',
    description: 'Teste diferentes variações',
    icon: 'FlaskConical',
    color: '#A855F7',
    category: 'logic',
    defaultData: { testName: '', variants: [] },
    isPremium: true,
    isNew: true,
  },
  random: {
    type: 'random',
    label: 'Aleatório',
    description: 'Escolhe um caminho aleatório',
    icon: 'Shuffle',
    color: '#EC4899',
    category: 'logic',
    defaultData: { outputs: [] },
  },
  time_condition: {
    type: 'time_condition',
    label: 'Condição de Tempo',
    description: 'Ramifica por horário ou data',
    icon: 'CalendarClock',
    color: '#EC4899',
    category: 'logic',
    defaultData: { conditions: [] },
  },
  set_variable: {
    type: 'set_variable',
    label: 'Definir Variável',
    description: 'Define ou modifica variáveis',
    icon: 'Variable',
    color: '#14B8A6',
    category: 'logic',
    defaultData: { variableName: '', valueType: 'static', value: '' },
  },
  math_operation: {
    type: 'math_operation',
    label: 'Operação Matemática',
    description: 'Realiza cálculos',
    icon: 'Calculator',
    color: '#14B8A6',
    category: 'logic',
    defaultData: { resultVariable: 'result', expression: '' },
  },
  format_text: {
    type: 'format_text',
    label: 'Formatar Texto',
    description: 'Formata e combina textos',
    icon: 'Type',
    color: '#14B8A6',
    category: 'logic',
    defaultData: { template: '', resultVariable: 'formatted_text' },
  },

  // Actions
  action: {
    type: 'action',
    label: 'Ação',
    description: 'Executa uma ação no sistema',
    icon: 'Zap',
    color: '#10B981',
    category: 'action',
    defaultData: { actionType: 'tag_contact', config: {} },
  },
  handoff: {
    type: 'handoff',
    label: 'Transferir',
    description: 'Transfere para atendente humano',
    icon: 'UserCheck',
    color: '#EF4444',
    category: 'action',
    defaultData: { message: 'Transferindo para um atendente...' },
  },
  send_email: {
    type: 'send_email',
    label: 'Enviar Email',
    description: 'Envia um email',
    icon: 'Mail',
    color: '#3B82F6',
    category: 'action',
    defaultData: { to: '', subject: '', body: '' },
  },
  send_sms: {
    type: 'send_sms',
    label: 'Enviar SMS',
    description: 'Envia uma mensagem SMS',
    icon: 'Smartphone',
    color: '#10B981',
    category: 'action',
    defaultData: { to: '', message: '' },
    isPremium: true,
  },
  create_deal: {
    type: 'create_deal',
    label: 'Criar Negócio',
    description: 'Cria um negócio no CRM',
    icon: 'DollarSign',
    color: '#F59E0B',
    category: 'action',
    defaultData: { title: '' },
  },
  update_contact: {
    type: 'update_contact',
    label: 'Atualizar Contato',
    description: 'Atualiza dados do contato',
    icon: 'UserCog',
    color: '#10B981',
    category: 'action',
    defaultData: { fields: [] },
  },
  add_tag: {
    type: 'add_tag',
    label: 'Adicionar Tag',
    description: 'Adiciona tags ao contato',
    icon: 'Tag',
    color: '#8B5CF6',
    category: 'action',
    defaultData: { tags: [] },
  },
  remove_tag: {
    type: 'remove_tag',
    label: 'Remover Tag',
    description: 'Remove tags do contato',
    icon: 'TagOff',
    color: '#EF4444',
    category: 'action',
    defaultData: { tags: [] },
  },
  schedule_message: {
    type: 'schedule_message',
    label: 'Agendar Mensagem',
    description: 'Agenda uma mensagem futura',
    icon: 'CalendarPlus',
    color: '#3B82F6',
    category: 'action',
    defaultData: { message: '', scheduleType: 'delay', delayMinutes: 60 },
  },

  // AI
  ai_response: {
    type: 'ai_response',
    label: 'Resposta IA',
    description: 'Gera resposta com IA',
    icon: 'Sparkles',
    color: '#A855F7',
    category: 'ai',
    defaultData: { useKnowledgeBase: true, fallbackMessage: 'Não consegui encontrar uma resposta.' },
  },
  ai_classifier: {
    type: 'ai_classifier',
    label: 'Classificador IA',
    description: 'Classifica mensagens em categorias',
    icon: 'Brain',
    color: '#A855F7',
    category: 'ai',
    defaultData: { inputVariable: 'last_message', categories: [] },
    isNew: true,
  },
  ai_sentiment: {
    type: 'ai_sentiment',
    label: 'Análise de Sentimento',
    description: 'Analisa sentimento da mensagem',
    icon: 'Heart',
    color: '#EC4899',
    category: 'ai',
    defaultData: { inputVariable: 'last_message', resultVariable: 'sentiment' },
  },
  ai_extract: {
    type: 'ai_extract',
    label: 'Extrair Dados',
    description: 'Extrai informações com IA',
    icon: 'FileSearch',
    color: '#A855F7',
    category: 'ai',
    defaultData: { inputVariable: 'last_message', extractions: [] },
    isPremium: true,
  },
  ai_summarize: {
    type: 'ai_summarize',
    label: 'Resumir',
    description: 'Resume texto com IA',
    icon: 'FileText',
    color: '#A855F7',
    category: 'ai',
    defaultData: { inputVariable: 'conversation', resultVariable: 'summary' },
  },
  ai_translate: {
    type: 'ai_translate',
    label: 'Traduzir',
    description: 'Traduz texto para outro idioma',
    icon: 'Languages',
    color: '#0EA5E9',
    category: 'ai',
    defaultData: { inputVariable: 'last_message', resultVariable: 'translated', targetLanguage: 'en' },
  },

  // Integrations
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'Chama uma API externa',
    icon: 'Webhook',
    color: '#0EA5E9',
    category: 'integration',
    defaultData: { url: '', method: 'POST', timeout: 30000 },
  },
  http_request: {
    type: 'http_request',
    label: 'Requisição HTTP',
    description: 'Faz uma requisição HTTP customizada',
    icon: 'Globe',
    color: '#0EA5E9',
    category: 'integration',
    defaultData: { url: '', method: 'GET', responseVariable: 'response' },
  },
  google_sheets: {
    type: 'google_sheets',
    label: 'Google Sheets',
    description: 'Integra com Google Planilhas',
    icon: 'Table',
    color: '#22C55E',
    category: 'integration',
    defaultData: { action: 'append', spreadsheetId: '', sheetName: '' },
    isPremium: true,
  },
  zapier: {
    type: 'zapier',
    label: 'Zapier',
    description: 'Conecta com Zapier',
    icon: 'Zap',
    color: '#FF4F00',
    category: 'integration',
    defaultData: { webhookUrl: '', data: {} },
  },
  custom_code: {
    type: 'custom_code',
    label: 'Código Customizado',
    description: 'Executa código JavaScript',
    icon: 'Code',
    color: '#6B7280',
    category: 'integration',
    defaultData: { language: 'javascript', code: '' },
    isPremium: true,
  },

  // E-commerce
  product_catalog: {
    type: 'product_catalog',
    label: 'Catálogo de Produtos',
    description: 'Mostra produtos do catálogo',
    icon: 'ShoppingBag',
    color: '#F59E0B',
    category: 'ecommerce',
    defaultData: { displayType: 'carousel', limit: 5, showPrice: true },
    isPremium: true,
  },
  cart: {
    type: 'cart',
    label: 'Carrinho',
    description: 'Gerencia o carrinho de compras',
    icon: 'ShoppingCart',
    color: '#F59E0B',
    category: 'ecommerce',
    defaultData: { action: 'show', showSummary: true },
    isPremium: true,
  },
  payment: {
    type: 'payment',
    label: 'Pagamento',
    description: 'Processa pagamentos',
    icon: 'CreditCard',
    color: '#22C55E',
    category: 'ecommerce',
    defaultData: { provider: 'pix', currency: 'BRL' },
    isPremium: true,
    isNew: true,
  },
  order_status: {
    type: 'order_status',
    label: 'Status do Pedido',
    description: 'Mostra status do pedido',
    icon: 'Package',
    color: '#3B82F6',
    category: 'ecommerce',
    defaultData: { orderIdVariable: 'order_id', showDetails: true, showTracking: true },
    isPremium: true,
  },

  // Multimedia
  image: {
    type: 'image',
    label: 'Imagem',
    description: 'Envia uma imagem',
    icon: 'Image',
    color: '#6366F1',
    category: 'multimedia',
    defaultData: { url: '' },
  },
  video: {
    type: 'video',
    label: 'Vídeo',
    description: 'Envia um vídeo',
    icon: 'Video',
    color: '#EF4444',
    category: 'multimedia',
    defaultData: { url: '' },
  },
  audio: {
    type: 'audio',
    label: 'Áudio',
    description: 'Envia um áudio',
    icon: 'Volume2',
    color: '#F59E0B',
    category: 'multimedia',
    defaultData: { url: '' },
  },
  document: {
    type: 'document',
    label: 'Documento',
    description: 'Envia um documento',
    icon: 'FileText',
    color: '#6B7280',
    category: 'multimedia',
    defaultData: { url: '', filename: '' },
  },
  sticker: {
    type: 'sticker',
    label: 'Sticker',
    description: 'Envia um sticker',
    icon: 'Smile',
    color: '#F59E0B',
    category: 'multimedia',
    defaultData: { url: '' },
  },
};

// =====================================================
// Form/Create Types
// =====================================================

export interface CreateChatbotInput {
  name: string;
  description?: string;
  nodes?: ChatbotNode[];
  edges?: ChatbotEdge[];
  triggers?: ChatbotTrigger[];
  active_channels?: string[];
  templateId?: string;
}

export interface UpdateChatbotInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  nodes?: ChatbotNode[];
  edges?: ChatbotEdge[];
  variables?: ChatbotVariable[] | Record<string, unknown>;
  settings?: Partial<ChatbotSettings>;
  triggers?: ChatbotTrigger[];
  active_channels?: string[];
  status?: ChatbotStatus;
  folder_id?: string;
  tags?: string[];
}

export interface PublishChatbotInput {
  release_notes?: string;
}

// =====================================================
// Analytics Types
// =====================================================

export interface ChatbotAnalytics {
  chatbot_id: string;
  period: 'day' | 'week' | 'month' | 'all_time';
  total_executions: number;
  unique_contacts: number;
  completion_rate: number;
  handoff_rate: number;
  avg_duration_seconds: number;
  avg_messages: number;
  top_drop_off_nodes: { node_id: string; node_type: string; count: number }[];
  top_handoff_reasons: { reason: string; count: number }[];
  satisfaction_avg?: number;
  nps_avg?: number;
  conversions?: number;
  conversion_rate?: number;
  revenue_generated?: number;
  hourly_distribution: { hour: number; count: number }[];
  daily_trend: { date: string; executions: number; completions: number }[];
  ab_test_results?: { test_name: string; variants: { name: string; impressions: number; conversions: number; rate: number }[] }[];
}

export interface NodeAnalytics {
  node_id: string;
  node_type: ChatbotNodeType;
  executions: number;
  avg_duration_ms: number;
  drop_off_count: number;
  drop_off_rate: number;
  response_distribution?: Record<string, number>;
  error_count: number;
}
