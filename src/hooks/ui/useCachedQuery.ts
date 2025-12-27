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
  const shouldUseRedisCache = env.VITE_CACHE_ENABLED && (options.cacheConfig || options.cacheTTL);

  // Sempre chama ambos os hooks (regra dos hooks do React)
  const redisCacheResult = useRedisCache<TData>({
    ...options,
    queryKey: options.queryKey as unknown[],
    queryFn: options.queryFn as () => Promise<TData>,
  });

  const normalQueryResult = useQuery<TData>(options);

  // Retorna o resultado apropriado baseado na configuração
  return shouldUseRedisCache ? redisCacheResult : normalQueryResult;
}

