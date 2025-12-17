/**
 * Constantes globais da aplicação
 * Centralize valores fixos aqui para fácil manutenção
 */

// ==========================================
// TIMEOUTS E DELAYS
// ==========================================

export const TIMEOUTS = {
  /** Timeout padrão de requisições HTTP (30s) */
  HTTP_REQUEST: 30 * 1000,

  /** Debounce padrão para buscas (300ms) */
  SEARCH_DEBOUNCE: 300,

  /** Debounce para auto-save (1s) */
  AUTO_SAVE_DEBOUNCE: 1000,

  /** Throttle para scroll events (100ms) */
  SCROLL_THROTTLE: 100,

  /** Timeout de sessão idle (30 minutos) */
  IDLE_TIMEOUT: 30 * 60 * 1000,

  /** Tempo de aviso antes do logout (1 minuto) */
  IDLE_WARNING: 60 * 1000,

  /** Toast notification duration (5s) */
  TOAST_DURATION: 5000,
} as const;

// ==========================================
// CACHE & QUERY
// ==========================================

export const CACHE = {
  /** Tempo de stale do React Query (5 min) */
  STALE_TIME: 5 * 60 * 1000,

  /** Garbage collection time (10 min) */
  GC_TIME: 10 * 60 * 1000,

  /** Tempo de cache de assets (1 dia) */
  ASSETS_CACHE: 24 * 60 * 60 * 1000,

  /** Versão do cache local (incrementar ao fazer breaking changes) */
  VERSION: 'v1',
} as const;

// ==========================================
// RATE LIMITING
// ==========================================

export const RATE_LIMITS = {
  /** Mensagens por minuto */
  MESSAGES_PER_MINUTE: 10,

  /** Tentativas de login por 5 minutos */
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW: 5 * 60 * 1000,

  /** Buscas por minuto */
  SEARCHES_PER_MINUTE: 30,

  /** Uploads por hora */
  UPLOADS_PER_HOUR: 50,
  UPLOAD_WINDOW: 60 * 60 * 1000,
} as const;

// ==========================================
// PAGINAÇÃO E VIRTUALIZAÇÃO
// ==========================================

export const PAGINATION = {
  /** Items por página padrão */
  DEFAULT_PAGE_SIZE: 20,

  /** Items por página em listas */
  LIST_PAGE_SIZE: 50,

  /** Altura padrão de item de lista (px) */
  LIST_ITEM_HEIGHT: 72,

  /** Overscan em listas virtualizadas */
  VIRTUAL_LIST_OVERSCAN: 5,

  /** Threshold para carregar mais items (infinite scroll) */
  INFINITE_SCROLL_THRESHOLD: 0.8,
} as const;

// ==========================================
// UPLOAD DE ARQUIVOS
// ==========================================

export const UPLOAD = {
  /** Tamanho máximo de arquivo (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Tamanho máximo de imagem (5MB) */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,

  /** Tamanho máximo de vídeo (50MB) */
  MAX_VIDEO_SIZE: 50 * 1024 * 1024,

  /** Tipos de imagem aceitos */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  /** Tipos de documento aceitos */
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],

  /** Tipos de vídeo aceitos */
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],

  /** Tipos de áudio aceitos */
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
} as const;

// ==========================================
// VALIDAÇÃO
// ==========================================

export const VALIDATION = {
  /** Comprimento mínimo de senha */
  MIN_PASSWORD_LENGTH: 8,

  /** Comprimento máximo de senha */
  MAX_PASSWORD_LENGTH: 128,

  /** Comprimento mínimo de nome */
  MIN_NAME_LENGTH: 2,

  /** Comprimento máximo de nome */
  MAX_NAME_LENGTH: 100,

  /** Comprimento máximo de mensagem */
  MAX_MESSAGE_LENGTH: 4096,

  /** Comprimento máximo de bio */
  MAX_BIO_LENGTH: 500,

  /** Regex de email */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /** Regex de telefone (Brasil) */
  PHONE_REGEX: /^\+?55\s?(\d{2})\s?9?\d{4}-?\d{4}$/,

  /** Regex de CPF */
  CPF_REGEX: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,

  /** Regex de CNPJ */
  CNPJ_REGEX: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
} as const;

// ==========================================
// BREAKPOINTS (Tailwind)
// ==========================================

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// ==========================================
// ZINDEX LAYERS
// ==========================================

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
} as const;

// ==========================================
// PERMISSÕES
// ==========================================

export const PERMISSIONS = {
  // Chat
  CHAT_VIEW_ALL: 'chat.view_all',
  CHAT_VIEW_TEAM: 'chat.view_team',
  CHAT_VIEW_OWN: 'chat.view_own',
  CHAT_SEND: 'chat.send_messages',
  CHAT_TRANSFER: 'chat.transfer',
  CHAT_CLOSE: 'chat.close',
  CHAT_DELETE: 'chat.delete_messages',

  // Deals
  DEALS_VIEW_ALL: 'deals.view_all',
  DEALS_VIEW_OWN: 'deals.view_own',
  DEALS_CREATE: 'deals.create',
  DEALS_EDIT_ALL: 'deals.edit_all',
  DEALS_EDIT_OWN: 'deals.edit_own',
  DEALS_DELETE: 'deals.delete',
  DEALS_MOVE_STAGE: 'deals.move_stage',

  // Campaigns
  CAMPAIGNS_VIEW: 'campaigns.view',
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_EDIT: 'campaigns.edit',
  CAMPAIGNS_EXECUTE: 'campaigns.execute',
  CAMPAIGNS_DELETE: 'campaigns.delete',

  // Reports
  REPORTS_VIEW_ALL: 'reports.view_all',
  REPORTS_VIEW_TEAM: 'reports.view_team',
  REPORTS_VIEW_OWN: 'reports.view_own',
  REPORTS_EXPORT: 'reports.export',

  // Settings
  SETTINGS_COMPANY: 'settings.company',
  SETTINGS_USERS: 'settings.users',
  SETTINGS_PIPELINES: 'settings.pipelines',
  SETTINGS_INTEGRATIONS: 'settings.integrations',
} as const;

// ==========================================
// ROLES
// ==========================================

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  VIEWER: 'viewer',
} as const;

export const ROLE_LEVELS = {
  [ROLES.ADMIN]: 90,
  [ROLES.MANAGER]: 70,
  [ROLES.AGENT]: 40,
  [ROLES.VIEWER]: 20,
} as const;

// ==========================================
// STATUS
// ==========================================

export const CONVERSATION_STATUS = {
  WAITING: 'waiting',
  RE_ENTRY: 're_entry',
  ACTIVE: 'active',
  CHATBOT: 'chatbot',
  CLOSED: 'closed',
} as const;

export const DEAL_STATUS = {
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost',
} as const;

export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

// ==========================================
// CORES (Semantic)
// ==========================================

export const COLORS = {
  STATUS: {
    SUCCESS: 'green',
    WARNING: 'yellow',
    ERROR: 'red',
    INFO: 'blue',
  },
  PRIORITY: {
    LOW: 'gray',
    MEDIUM: 'blue',
    HIGH: 'orange',
    URGENT: 'red',
  },
  TEMPERATURE: {
    HOT: 'red',
    WARM: 'orange',
    COLD: 'blue',
  },
} as const;

// ==========================================
export const EVOLUTION_ENDPOINTS = {
  CREATE_INSTANCE: '/instance/create',
  DELETE_INSTANCE: '/instance/delete',
  CONNECT_INSTANCE: '/instance/connect',
  LOGOUT_INSTANCE: '/instance/logout',
  QR_CODE: '/instance/qrcode',
  STATUS: '/instance/status',
  SEND_MESSAGE: '/message/sendText',
  SEND_MEDIA: '/message/sendMedia',
  SEND_AUDIO: '/message/sendAudio',
} as const;

// ==========================================
// FORMATAÇÃO
// ==========================================

export const FORMAT = {
  /** Formato de data padrão */
  DATE: 'dd/MM/yyyy',

  /** Formato de datetime */
  DATETIME: 'dd/MM/yyyy HH:mm',

  /** Formato de hora */
  TIME: 'HH:mm',

  /** Moeda padrão */
  CURRENCY: 'BRL',

  /** Locale padrão */
  LOCALE: 'pt-BR',
} as const;

// ==========================================
// FEATURE FLAGS (padrão)
// ==========================================

export const FEATURES = {
  /** Habilitar modo dark */
  DARK_MODE: true,

  /** Habilitar PWA install prompt */
  PWA_INSTALL: true,

  /** Habilitar notificações push */
  PUSH_NOTIFICATIONS: true,

  /** Habilitar modo offline */
  OFFLINE_MODE: false,

  /** Habilitar analytics */
  ANALYTICS: false,

  /** Habilitar error tracking */
  ERROR_TRACKING: false,
} as const;

// ==========================================
// TIPOS DERIVADOS
// ==========================================

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type Role = (typeof ROLES)[keyof typeof ROLES];
export type ConversationStatus = (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];
export type DealStatus = (typeof DEAL_STATUS)[keyof typeof DEAL_STATUS];
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];
export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];
