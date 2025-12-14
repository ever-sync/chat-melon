// =====================================================
// Types for Visual Chatbot Builder
// =====================================================

import type { Node, Edge } from 'reactflow';

// =====================================================
// Node Types
// =====================================================

export type ChatbotNodeType =
  | 'start'
  | 'message'
  | 'question'
  | 'menu'
  | 'condition'
  | 'action'
  | 'delay'
  | 'handoff'
  | 'ai_response'
  | 'webhook'
  | 'set_variable'
  | 'end';

// Base data for all nodes
export interface BaseNodeData {
  label?: string;
}

// Start Node
export interface StartNodeData extends BaseNodeData {
  label: string;
}

// Message Node - Sends a message
export interface MessageNodeData extends BaseNodeData {
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  buttons?: MessageButton[];
}

export interface MessageButton {
  id: string;
  label: string;
  action: 'url' | 'next_node' | 'phone';
  value: string;
}

// Question Node - Asks for user input
export interface QuestionNodeData extends BaseNodeData {
  question: string;
  variableName: string;
  validation?: 'text' | 'email' | 'phone' | 'number' | 'date' | 'cpf' | 'cnpj' | 'custom';
  customValidationRegex?: string;
  errorMessage?: string;
  maxRetries?: number;
}

// Menu Node - Shows options
export interface MenuNodeData extends BaseNodeData {
  title: string;
  options: MenuOption[];
  allowTypedResponse?: boolean;
  invalidOptionMessage?: string;
}

export interface MenuOption {
  id: string;
  label: string;
  value: string;
  emoji?: string;
}

// Condition Node - Branching logic
export interface ConditionNodeData extends BaseNodeData {
  conditions: Condition[];
  defaultBranch?: string;
}

export interface Condition {
  id: string;
  variable: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less' | 'regex' | 'exists' | 'not_exists';
  value: string;
  targetNodeId?: string;
}

// Action Node - Performs an action
export interface ActionNodeData extends BaseNodeData {
  actionType: 'tag_contact' | 'assign_agent' | 'assign_team' | 'update_contact' | 'send_email' | 'create_ticket';
  config: Record<string, unknown>;
}

// Delay Node - Waits before continuing
export interface DelayNodeData extends BaseNodeData {
  delayType: 'fixed' | 'typing';
  delayMs: number;
  showTypingIndicator?: boolean;
}

// Handoff Node - Transfers to human
export interface HandoffNodeData extends BaseNodeData {
  message?: string;
  teamId?: string;
  agentId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  transferNote?: string;
}

// AI Response Node - Uses AI to generate response
export interface AIResponseNodeData extends BaseNodeData {
  prompt?: string;
  useKnowledgeBase?: boolean;
  knowledgeBaseId?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackMessage?: string;
}

// Webhook Node - Calls external API
export interface WebhookNodeData extends BaseNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  responseVariable?: string;
  timeout?: number;
}

// Set Variable Node
export interface SetVariableNodeData extends BaseNodeData {
  variableName: string;
  valueType: 'static' | 'expression' | 'from_response';
  value: string;
}

// End Node
export interface EndNodeData extends BaseNodeData {
  closeConversation?: boolean;
  endMessage?: string;
}

// Union type for all node data
export type ChatbotNodeData =
  | StartNodeData
  | MessageNodeData
  | QuestionNodeData
  | MenuNodeData
  | ConditionNodeData
  | ActionNodeData
  | DelayNodeData
  | HandoffNodeData
  | AIResponseNodeData
  | WebhookNodeData
  | SetVariableNodeData
  | EndNodeData;

// Typed node for ReactFlow
export type ChatbotNode = Node<ChatbotNodeData, ChatbotNodeType>;
export type ChatbotEdge = Edge;

// =====================================================
// Chatbot Types
// =====================================================

export type ChatbotStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface ChatbotTrigger {
  type: 'keyword' | 'first_message' | 'menu_option' | 'schedule' | 'manual';
  value?: string;
  channel?: string;
  schedule?: {
    days: number[];
    startTime: string;
    endTime: string;
  };
}

export interface ChatbotSettings {
  typing_delay_ms: number;
  default_fallback_message: string;
  max_retries: number;
  session_timeout_minutes: number;
  track_analytics?: boolean;
  allow_restart?: boolean;
}

export interface Chatbot {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
  variables: Record<string, unknown>;
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
  variables: Record<string, unknown>;
  settings: ChatbotSettings;
  triggers: ChatbotTrigger[];
  published_by?: string;
  published_at: string;
  release_notes?: string;
}

// =====================================================
// Execution Types
// =====================================================

export type ExecutionStatus = 'running' | 'waiting_input' | 'completed' | 'handoff' | 'failed' | 'timeout';

export interface ExecutionLogEntry {
  node_id: string;
  type: ChatbotNodeType;
  timestamp: string;
  duration_ms?: number;
  content?: string;
  question?: string;
  answer?: string;
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
  status: ExecutionStatus;
  session_variables: Record<string, unknown>;
  execution_log: ExecutionLogEntry[];
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
}

// =====================================================
// Template Types
// =====================================================

export type TemplateCategory = 'atendimento' | 'vendas' | 'suporte' | 'agendamento' | 'marketing' | 'custom';

export interface ChatbotTemplate {
  id: string;
  name: string;
  description?: string;
  category?: TemplateCategory;
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
  variables: Record<string, unknown>;
  preview_image_url?: string;
  usage_count: number;
  is_system: boolean;
  company_id?: string;
  created_at: string;
}

// =====================================================
// UI Helper Types
// =====================================================

export interface NodeTypeInfo {
  type: ChatbotNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: 'flow' | 'interaction' | 'logic' | 'integration' | 'action';
  defaultData: Partial<ChatbotNodeData>;
}

export const NODE_TYPE_INFO: Record<ChatbotNodeType, NodeTypeInfo> = {
  start: {
    type: 'start',
    label: 'Início',
    description: 'Ponto de entrada do fluxo',
    icon: 'Play',
    color: '#22C55E',
    category: 'flow',
    defaultData: { label: 'Início' },
  },
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
    defaultData: { title: '', options: [] },
  },
  condition: {
    type: 'condition',
    label: 'Condição',
    description: 'Ramifica o fluxo baseado em condições',
    icon: 'GitBranch',
    color: '#EC4899',
    category: 'logic',
    defaultData: { conditions: [] },
  },
  action: {
    type: 'action',
    label: 'Ação',
    description: 'Executa uma ação no sistema',
    icon: 'Zap',
    color: '#10B981',
    category: 'action',
    defaultData: { actionType: 'tag_contact', config: {} },
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
  handoff: {
    type: 'handoff',
    label: 'Transferir',
    description: 'Transfere para atendente humano',
    icon: 'UserCheck',
    color: '#EF4444',
    category: 'action',
    defaultData: { message: 'Transferindo para um atendente...' },
  },
  ai_response: {
    type: 'ai_response',
    label: 'IA',
    description: 'Gera resposta com inteligência artificial',
    icon: 'Sparkles',
    color: '#A855F7',
    category: 'integration',
    defaultData: { useKnowledgeBase: true, fallbackMessage: 'Não consegui encontrar uma resposta.' },
  },
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'Chama uma API externa',
    icon: 'Globe',
    color: '#0EA5E9',
    category: 'integration',
    defaultData: { url: '', method: 'POST', timeout: 30000 },
  },
  set_variable: {
    type: 'set_variable',
    label: 'Variável',
    description: 'Define ou modifica uma variável',
    icon: 'Variable',
    color: '#14B8A6',
    category: 'logic',
    defaultData: { variableName: '', valueType: 'static', value: '' },
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
}

export interface UpdateChatbotInput {
  name?: string;
  description?: string;
  nodes?: ChatbotNode[];
  edges?: ChatbotEdge[];
  variables?: Record<string, unknown>;
  settings?: Partial<ChatbotSettings>;
  triggers?: ChatbotTrigger[];
  active_channels?: string[];
  status?: ChatbotStatus;
}

export interface PublishChatbotInput {
  release_notes?: string;
}
