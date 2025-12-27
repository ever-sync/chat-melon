/**
 * Estratégias de cache e TTLs configuráveis
 * 
 * Define TTLs (Time To Live) e estratégias de cache para diferentes tipos de dados.
 */

export const CACHE_TTL = {
  // Métricas do dashboard: 5 minutos
  DASHBOARD_METRICS: 5 * 60,

  // Lista de conversas: 2 minutos
  CONVERSATIONS_LIST: 2 * 60,

  // Dados de contato: 10 minutos
  CONTACT_DATA: 10 * 60,

  // Configurações: 30 minutos
  SETTINGS: 30 * 60,

  // Dados estáticos: 1 hora
  STATIC_DATA: 60 * 60,

  // Mensagens: 1 minuto (dados muito dinâmicos)
  MESSAGES: 1 * 60,

  // Deals/CRM: 3 minutos
  DEALS_LIST: 3 * 60,

  // Performance de agentes: 5 minutos
  AGENT_STATS: 5 * 60,
} as const;

export type CacheTTL = typeof CACHE_TTL[keyof typeof CACHE_TTL];

/**
 * Tags de cache para invalidação em cascata
 */
export const CACHE_TAGS = {
  COMPANY: (companyId: string) => `company:${companyId}`,
  CONVERSATION: (conversationId: string) => `conversation:${conversationId}`,
  CONTACT: (contactId: string) => `contact:${contactId}`,
  DEAL: (dealId: string) => `deal:${dealId}`,
  USER: (userId: string) => `user:${userId}`,
  DASHBOARD: (companyId: string) => `dashboard:${companyId}`,
} as const;

/**
 * Estratégias de invalidação
 */
export enum CacheInvalidationStrategy {
  /**
   * Invalidar apenas a chave específica
   */
  KEY_ONLY = 'key_only',

  /**
   * Invalidar todas as chaves com a tag
   */
  TAG_BASED = 'tag_based',

  /**
   * Invalidar chave e todas relacionadas
   */
  CASCADE = 'cascade',
}

/**
 * Configuração de cache para um tipo de dado
 */
export interface CacheConfig {
  ttl: number;
  strategy: CacheInvalidationStrategy;
  tags?: string[];
}

/**
 * Configurações pré-definidas por tipo de dado
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  dashboard_metrics: {
    ttl: CACHE_TTL.DASHBOARD_METRICS,
    strategy: CacheInvalidationStrategy.TAG_BASED,
  },
  conversations_list: {
    ttl: CACHE_TTL.CONVERSATIONS_LIST,
    strategy: CacheInvalidationStrategy.TAG_BASED,
  },
  contact_data: {
    ttl: CACHE_TTL.CONTACT_DATA,
    strategy: CacheInvalidationStrategy.KEY_ONLY,
  },
  settings: {
    ttl: CACHE_TTL.SETTINGS,
    strategy: CacheInvalidationStrategy.KEY_ONLY,
  },
  messages: {
    ttl: CACHE_TTL.MESSAGES,
    strategy: CacheInvalidationStrategy.CASCADE,
  },
  deals_list: {
    ttl: CACHE_TTL.DEALS_LIST,
    strategy: CacheInvalidationStrategy.TAG_BASED,
  },
  agent_stats: {
    ttl: CACHE_TTL.AGENT_STATS,
    strategy: CacheInvalidationStrategy.TAG_BASED,
  },
};

