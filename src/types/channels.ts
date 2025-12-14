// =====================================================
// Types for Multi-Channel Support
// =====================================================

export type ChannelType = 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'widget' | 'email';

export type ChannelStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'rate_limited';

export interface Channel {
  id: string;
  company_id: string;
  type: ChannelType;
  name: string;
  credentials: ChannelCredentials;
  status: ChannelStatus;
  last_sync_at: string | null;
  error_message: string | null;
  settings: ChannelSettings;
  total_conversations: number;
  total_messages_sent: number;
  total_messages_received: number;
  external_id: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
}

// Credenciais por tipo de canal
export type ChannelCredentials =
  | WhatsAppCredentials
  | InstagramCredentials
  | MessengerCredentials
  | TelegramCredentials
  | WidgetCredentials
  | EmailCredentials;

export interface WhatsAppCredentials {
  instance_name: string;
  api_key?: string;
  api_url?: string;
}

export interface InstagramCredentials {
  page_id: string;
  instagram_account_id: string;
  access_token: string;
  token_expires_at?: string;
}

export interface MessengerCredentials {
  page_id: string;
  page_access_token: string;
  app_id?: string;
  app_secret?: string;
}

export interface TelegramCredentials {
  bot_token: string;
  bot_username: string;
}

export interface WidgetCredentials {
  company_id: string;
}

export interface EmailCredentials {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  imap_host?: string;
  imap_port?: number;
  from_name?: string;
  from_email?: string;
}

// Settings por tipo de canal
export type ChannelSettings =
  | InstagramSettings
  | MessengerSettings
  | TelegramSettings
  | Record<string, unknown>;

export interface InstagramSettings {
  ice_breakers?: IceBreaker[];
  quick_replies?: QuickReply[];
  story_replies_enabled?: boolean;
}

export interface MessengerSettings {
  persistent_menu?: PersistentMenuItem[];
  get_started_payload?: string;
  greeting_text?: string;
}

export interface TelegramSettings {
  inline_mode_enabled?: boolean;
  group_privacy_mode?: boolean;
}

export interface IceBreaker {
  question: string;
  payload: string;
}

export interface QuickReply {
  content_type: 'text' | 'phone' | 'email';
  title: string;
  payload?: string;
  image_url?: string;
}

export interface PersistentMenuItem {
  type: 'web_url' | 'postback' | 'nested';
  title: string;
  url?: string;
  payload?: string;
  webview_height_ratio?: 'compact' | 'tall' | 'full';
  call_to_actions?: PersistentMenuItem[];
}

// =====================================================
// Instagram Specific Types
// =====================================================

export type InstagramMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'story_mention'
  | 'story_reply'
  | 'reaction';

export interface InstagramMessageMetadata {
  id: string;
  message_id: string;
  instagram_message_type: InstagramMessageType;
  story_id?: string;
  story_url?: string;
  reaction_emoji?: string;
  reply_to_message_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// =====================================================
// Messenger Specific Types
// =====================================================

export type MessengerTemplateType = 'generic' | 'button' | 'receipt' | 'media';

export interface MessengerTemplate {
  id: string;
  company_id: string;
  channel_id: string;
  name: string;
  type: MessengerTemplateType;
  payload: MessengerTemplatePayload;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface MessengerTemplatePayload {
  template_type: MessengerTemplateType;
  elements?: MessengerElement[];
  buttons?: MessengerButton[];
  text?: string;
}

export interface MessengerElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: MessengerDefaultAction;
  buttons?: MessengerButton[];
}

export interface MessengerButton {
  type: 'web_url' | 'postback' | 'phone_number' | 'account_link' | 'account_unlink';
  title: string;
  url?: string;
  payload?: string;
  webview_height_ratio?: 'compact' | 'tall' | 'full';
}

export interface MessengerDefaultAction {
  type: 'web_url';
  url: string;
  webview_height_ratio?: 'compact' | 'tall' | 'full';
}

// =====================================================
// Telegram Specific Types
// =====================================================

export interface TelegramBotCommand {
  id: string;
  channel_id: string;
  command: string;
  description: string;
  response?: string;
  action?: 'start_conversation' | 'show_menu' | 'handoff' | 'custom';
  is_active: boolean;
  created_at: string;
}

// =====================================================
// Channel Health Types
// =====================================================

export type ChannelHealthStatus = 'healthy' | 'degraded' | 'down';

export interface ChannelHealthLog {
  id: string;
  channel_id: string;
  status: ChannelHealthStatus;
  response_time_ms?: number;
  error_message?: string;
  check_type: 'api_call' | 'webhook_test' | 'auth_refresh';
  details: Record<string, unknown>;
  created_at: string;
}

// =====================================================
// UI Helper Types
// =====================================================

export interface ChannelInfo {
  type: ChannelType;
  name: string;
  icon: string;
  color: string;
  description: string;
  features: string[];
  requiredScopes?: string[];
}

export const CHANNEL_INFO: Record<ChannelType, ChannelInfo> = {
  whatsapp: {
    type: 'whatsapp',
    name: 'WhatsApp',
    icon: 'MessageCircle',
    color: '#25D366',
    description: 'Conecte sua conta do WhatsApp Business',
    features: ['Mensagens de texto', 'Mídia', 'Templates', 'Catálogo', 'Pagamentos'],
  },
  instagram: {
    type: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    color: '#E4405F',
    description: 'Gerencie DMs do Instagram Business',
    features: ['Direct Messages', 'Stories Mentions', 'Quick Replies', 'Ice Breakers'],
    requiredScopes: ['instagram_manage_messages', 'pages_manage_metadata'],
  },
  messenger: {
    type: 'messenger',
    name: 'Facebook Messenger',
    icon: 'Facebook',
    color: '#0084FF',
    description: 'Conecte sua Facebook Page',
    features: ['Mensagens', 'Templates', 'Persistent Menu', 'Quick Replies'],
    requiredScopes: ['pages_messaging', 'pages_manage_metadata'],
  },
  telegram: {
    type: 'telegram',
    name: 'Telegram',
    icon: 'Send',
    color: '#0088cc',
    description: 'Conecte seu bot do Telegram',
    features: ['Mensagens', 'Comandos', 'Inline Mode', 'Grupos'],
  },
  widget: {
    type: 'widget',
    name: 'Widget de Chat',
    icon: 'MessageSquare',
    color: '#22C55E',
    description: 'Widget para seu site',
    features: ['Chat ao vivo', 'Formulário pré-chat', 'Personalização'],
  },
  email: {
    type: 'email',
    name: 'Email',
    icon: 'Mail',
    color: '#6366F1',
    description: 'Integração com email',
    features: ['Receber emails', 'Enviar emails', 'Templates HTML'],
  },
};
