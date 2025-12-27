/**
 * Hook para integração de React Query com Redis cache
 * 
 * Verifica cache Redis primeiro, depois faz fallback para query normal.
 * Atualiza cache após query bem-sucedida.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import { redisClient, createCacheKey, isRedisAvailable } from '@/lib/cache/redis-client';
import { CACHE_CONFIGS, CACHE_TTL } from '@/lib/cache/cache-strategies';
import { invalidateCache } from '@/lib/cache/cache-invalidation';

export interface UseRedisCacheOptions<TData = unknown> extends Omit<UseQueryOptions<TData>, 'queryFn'> {
  queryKey: unknown[];
  queryFn: () => Promise<TData>;
  cacheKey?: string;
  cacheTTL?: number;
  cacheConfig?: string; // Nome da configuração pré-definida
  tags?: string[];
}

/**
 * Hook que integra React Query com Redis cache
 * 
 * @example
 * ```ts
 * const { data, isLoading } = useRedisCache({
 *   queryKey: ['conversations', companyId],
 *   queryFn: () => fetchConversations(companyId),
 *   cacheConfig: 'conversations_list',
 *   tags: [CACHE_TAGS.COMPANY(companyId)],
 * });
 * ```
 */
export function useRedisCache<TData = unknown>(
  options: UseRedisCacheOptions<TData>
): ReturnType<typeof useQuery<TData>> {
  const {
    queryKey,
    queryFn,
    cacheKey,
    cacheTTL,
    cacheConfig,
    tags = [],
    staleTime,
    gcTime,
    ...restOptions
  } = options;

  // Determinar TTL
  let ttl = cacheTTL;
  if (!ttl && cacheConfig && CACHE_CONFIGS[cacheConfig]) {
    ttl = CACHE_CONFIGS[cacheConfig].ttl;
  }
  if (!ttl) {
    ttl = CACHE_TTL.DASHBOARD_METRICS; // Default
  }

  // Gerar chave de cache
  const finalCacheKey = cacheKey || createCacheKey('query', ...queryKey.map(String));

  // Query function com cache Redis
  const cachedQueryFn = useCallback(async (): Promise<TData> => {
    // Verificar se Redis está disponível
    const redisAvailable = await isRedisAvailable();

    if (redisAvailable) {
      try {
        // Tentar buscar do cache Redis
        const cached = await redisClient.get<TData>(finalCacheKey);
        if (cached !== null) {
          console.log(`✅ Cache hit: ${finalCacheKey}`);
          return cached;
        }
        console.log(`❌ Cache miss: ${finalCacheKey}`);
      } catch (error) {
        console.warn('Erro ao buscar do cache Redis:', error);
      }
    }

    // Cache miss ou Redis indisponível: executar query
    const data = await queryFn();

    // Salvar no cache Redis (assíncrono, não bloqueia)
    if (redisAvailable) {
      redisClient.set(finalCacheKey, data, ttl).catch((error) => {
        console.warn('Erro ao salvar no cache Redis:', error);
      });
    }

    return data;
  }, [queryFn, finalCacheKey, ttl]);

  // Usar React Query com função cached
  const query = useQuery<TData>({
    queryKey,
    queryFn: cachedQueryFn,
    staleTime: staleTime || ttl * 1000, // Converter segundos para ms
    gcTime: gcTime || ttl * 1000 * 2, // GC time = 2x TTL
    ...restOptions,
  });

  // Função para invalidar cache manualmente
  const invalidate = useCallback(async () => {
    if (cacheConfig && CACHE_CONFIGS[cacheConfig]) {
      const config = CACHE_CONFIGS[cacheConfig];
      await invalidateCache(finalCacheKey, config.strategy, tags);
    } else {
      await redisClient.del(finalCacheKey);
    }
    query.refetch();
  }, [finalCacheKey, cacheConfig, tags, query]);

  return {
    ...query,
    invalidateCache: invalidate,
  } as ReturnType<typeof useQuery<TData>> & { invalidateCache: () => Promise<void> };
}

