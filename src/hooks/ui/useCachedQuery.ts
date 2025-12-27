/**
 * Wrapper sobre useQuery que adiciona suporte a Redis cache
 * 
 * Este hook é uma alternativa mais simples ao useRedisCache,
 * mantendo a mesma interface do useQuery mas com cache automático.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useRedisCache } from './useRedisCache';
import { env } from '@/config/env';

/**
 * Hook que usa Redis cache se disponível, senão usa React Query normal
 * 
 * @example
 * ```ts
 * const { data } = useCachedQuery({
 *   queryKey: ['dashboard', companyId],
 *   queryFn: () => fetchDashboard(companyId),
 *   cacheConfig: 'dashboard_metrics',
 * });
 * ```
 */
export function useCachedQuery<TData = unknown>(
  options: UseQueryOptions<TData> & {
    cacheConfig?: string;
    cacheTTL?: number;
    tags?: string[];
  }
) {
  // Se cache não está habilitado, usar React Query normal
  if (!env.VITE_CACHE_ENABLED) {
    return useQuery<TData>(options);
  }

  // Se tem configuração de cache, usar useRedisCache
  if (options.cacheConfig || options.cacheTTL) {
    return useRedisCache<TData>({
      ...options,
      queryKey: options.queryKey as unknown[],
      queryFn: options.queryFn as () => Promise<TData>,
    });
  }

  // Caso contrário, usar React Query normal
  return useQuery<TData>(options);
}

