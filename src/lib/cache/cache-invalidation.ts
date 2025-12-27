/**
 * Sistema de invalidação de cache
 * 
 * Suporta invalidação por:
 * - Chave específica
 * - Tags (invalidação em cascata)
 * - Padrões (wildcards)
 */

import { redisClient, createCacheKey } from './redis-client';
import { CACHE_TAGS, CacheInvalidationStrategy } from './cache-strategies';

/**
 * Invalidar uma chave específica
 */
export async function invalidateKey(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Erro ao invalidar chave de cache:', error);
  }
}

/**
 * Invalidar todas as chaves com uma tag específica
 */
export async function invalidateByTag(tag: string): Promise<void> {
  try {
    // Buscar todas as chaves com a tag
    const pattern = `${tag}:*`;
    const keys = await redisClient.keys(pattern);
    
    // Deletar todas as chaves encontradas
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisClient.del(key)));
    }
  } catch (error) {
    console.error('Erro ao invalidar cache por tag:', error);
  }
}

/**
 * Invalidar cache por padrão (wildcard)
 */
export async function invalidateByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisClient.del(key)));
    }
  } catch (error) {
    console.error('Erro ao invalidar cache por padrão:', error);
  }
}

/**
 * Invalidar cache de uma empresa (todas as chaves relacionadas)
 */
export async function invalidateCompanyCache(companyId: string): Promise<void> {
  try {
    // Invalidar por tag de empresa
    await invalidateByTag(CACHE_TAGS.COMPANY(companyId));
    
    // Invalidar dashboard
    await invalidateByTag(CACHE_TAGS.DASHBOARD(companyId));
  } catch (error) {
    console.error('Erro ao invalidar cache da empresa:', error);
  }
}

/**
 * Invalidar cache de uma conversa e dados relacionados
 */
export async function invalidateConversationCache(conversationId: string): Promise<void> {
  try {
    // Invalidar chaves específicas da conversa
    await invalidateByTag(CACHE_TAGS.CONVERSATION(conversationId));
    
    // Invalidar lista de conversas (será recarregada)
    await invalidateByPattern('conversations:*');
  } catch (error) {
    console.error('Erro ao invalidar cache da conversa:', error);
  }
}

/**
 * Invalidar cache de um contato e dados relacionados
 */
export async function invalidateContactCache(contactId: string): Promise<void> {
  try {
    await invalidateByTag(CACHE_TAGS.CONTACT(contactId));
    await invalidateByPattern('contacts:*');
  } catch (error) {
    console.error('Erro ao invalidar cache do contato:', error);
  }
}

/**
 * Invalidar cache de um deal e dados relacionados
 */
export async function invalidateDealCache(dealId: string): Promise<void> {
  try {
    await invalidateByTag(CACHE_TAGS.DEAL(dealId));
    await invalidateByPattern('deals:*');
    await invalidateByPattern('dashboard:*'); // Dashboard pode mostrar deals
  } catch (error) {
    console.error('Erro ao invalidar cache do deal:', error);
  }
}

/**
 * Invalidar cache baseado em estratégia
 */
export async function invalidateCache(
  key: string,
  strategy: CacheInvalidationStrategy,
  tags?: string[]
): Promise<void> {
  switch (strategy) {
    case CacheInvalidationStrategy.KEY_ONLY:
      await invalidateKey(key);
      break;

    case CacheInvalidationStrategy.TAG_BASED:
      if (tags && tags.length > 0) {
        await Promise.all(tags.map((tag) => invalidateByTag(tag)));
      } else {
        await invalidateKey(key);
      }
      break;

    case CacheInvalidationStrategy.CASCADE:
      await invalidateKey(key);
      if (tags && tags.length > 0) {
        await Promise.all(tags.map((tag) => invalidateByTag(tag)));
      }
      break;
  }
}

