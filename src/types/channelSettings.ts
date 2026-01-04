// Tipos para configurações de canal

export interface BusinessHours {
  monday: { start: string | null; end: string | null; enabled: boolean };
  tuesday: { start: string | null; end: string | null; enabled: boolean };
  wednesday: { start: string | null; end: string | null; enabled: boolean };
  thursday: { start: string | null; end: string | null; enabled: boolean };
  friday: { start: string | null; end: string | null; enabled: boolean };
  saturday: { start: string | null; end: string | null; enabled: boolean };
  sunday: { start: string | null; end: string | null; enabled: boolean };
}

export type AutoAssignMethod = 'round_robin' | 'least_busy' | 'random' | 'specific_user';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface ChannelSettings {
  id: string;
  channel_id: string;
  company_id: string;

  // Bot settings
  bot_enabled: boolean;
  bot_id: string | null;
  bot_welcome_message: string | null;
  bot_fallback_message: string;
  bot_transfer_to_human_keywords: string[];

  // AI settings
  ai_enabled: boolean;
  ai_model: string;
  ai_temperature: number;
  ai_max_tokens: number;
  ai_system_prompt: string | null;
  ai_auto_respond: boolean;
  ai_suggest_responses: boolean;
  ai_auto_categorize: boolean;
  ai_sentiment_analysis: boolean;

  // Business hours
  business_hours_enabled: boolean;
  business_hours: BusinessHours;
  timezone: string;
  outside_hours_message: string;

  // Auto messages
  welcome_message: string | null;
  welcome_message_enabled: boolean;
  away_message: string | null;
  away_message_enabled: boolean;

  // Routing
  auto_assign_enabled: boolean;
  auto_assign_method: AutoAssignMethod;
  auto_assign_user_id: string | null;
  auto_assign_sector_id: string | null;

  // SLA
  default_priority: Priority;
  sla_first_response_minutes: number;
  sla_resolution_minutes: number;

  // Channel specific
  channel_specific_settings: Record<string, unknown>;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Metadata específico por canal
export interface InstagramConversationMetadata {
  id: string;
  conversation_id: string;
  ig_thread_id: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  ig_profile_pic: string | null;
  ig_is_verified: boolean;
  ig_follower_count: number | null;
  ig_is_business: boolean;
  last_story_reply_id: string | null;
  story_reply_count: number;
  last_post_interaction_id: string | null;
  post_interaction_count: number;
  messages_received: number;
  messages_sent: number;
  avg_response_time_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface FacebookConversationMetadata {
  id: string;
  conversation_id: string;
  fb_user_id: string | null;
  fb_page_id: string | null;
  fb_thread_id: string | null;
  fb_profile_pic: string | null;
  fb_locale: string | null;
  fb_timezone: number | null;
  fb_gender: string | null;
  messages_received: number;
  messages_sent: number;
  referral_source: string | null;
  referral_type: string | null;
  referral_ad_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversationMetadata {
  id: string;
  conversation_id: string;
  wa_id: string | null;
  wa_phone: string | null;
  wa_profile_name: string | null;
  wa_profile_pic: string | null;
  wa_is_business: boolean;
  wa_business_name: string | null;
  wa_business_description: string | null;
  wa_is_contact: boolean;
  wa_is_blocked: boolean;
  last_template_sent: string | null;
  last_template_sent_at: string | null;
  template_messages_sent: number;
  session_started_at: string | null;
  session_expires_at: string | null;
  is_session_active: boolean;
  messages_received: number;
  messages_sent: number;
  media_received: number;
  media_sent: number;
  created_at: string;
  updated_at: string;
}

export interface WebchatConversationMetadata {
  id: string;
  conversation_id: string;
  visitor_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  current_page_url: string | null;
  current_page_title: string | null;
  referrer_url: string | null;
  landing_page: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_resolution: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  session_id: string | null;
  session_started_at: string | null;
  pages_visited: number;
  time_on_site_seconds: number;
  prechat_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Tipos para criação/atualização
export type ChannelSettingsCreate = Partial<Omit<ChannelSettings, 'id' | 'created_at' | 'updated_at'>> & {
  channel_id: string;
  company_id: string;
};

export type ChannelSettingsUpdate = Partial<Omit<ChannelSettings, 'id' | 'channel_id' | 'company_id' | 'created_at' | 'updated_at'>>;

// Defaults
export const defaultBusinessHours: BusinessHours = {
  monday: { start: '09:00', end: '18:00', enabled: true },
  tuesday: { start: '09:00', end: '18:00', enabled: true },
  wednesday: { start: '09:00', end: '18:00', enabled: true },
  thursday: { start: '09:00', end: '18:00', enabled: true },
  friday: { start: '09:00', end: '18:00', enabled: true },
  saturday: { start: '09:00', end: '13:00', enabled: false },
  sunday: { start: null, end: null, enabled: false },
};

export const defaultChannelSettings: Partial<ChannelSettings> = {
  bot_enabled: false,
  bot_fallback_message: 'Desculpe, não entendi. Um atendente irá ajudá-lo em breve.',
  bot_transfer_to_human_keywords: ['atendente', 'humano', 'pessoa', 'falar com alguém'],
  ai_enabled: false,
  ai_model: 'gpt-4o-mini',
  ai_temperature: 0.7,
  ai_max_tokens: 500,
  ai_auto_respond: false,
  ai_suggest_responses: true,
  ai_auto_categorize: true,
  ai_sentiment_analysis: true,
  business_hours_enabled: false,
  business_hours: defaultBusinessHours,
  timezone: 'America/Sao_Paulo',
  outside_hours_message: 'Estamos fora do horário de atendimento. Retornaremos em breve!',
  welcome_message_enabled: false,
  away_message_enabled: false,
  auto_assign_enabled: false,
  auto_assign_method: 'round_robin',
  default_priority: 'normal',
  sla_first_response_minutes: 30,
  sla_resolution_minutes: 480,
};
