import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { usePagination, UsePaginationReturn } from './usePagination';
import { PAGINATION } from '@/config/constants';

export interface PaginatedQueryOptions<TData = unknown> {
  queryKey: unknown[];
  queryFn: (params: { page: number; limit: number; offset: number }) => Promise<{
    data: TData[];
    count?: number;
  }>;
  initialPage?: number;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export interface PaginatedQueryResult<TData = unknown> extends UsePaginationReturn {
  data: TData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => void;
}

/**
 * Hook que combina paginação com React Query
 * 
 * @example
 * const { data, page, nextPage, hasNext, isLoading } = usePaginatedQuery({
 *   queryKey: ['conversations', companyId],
 *   queryFn: async ({ page, limit, offset }) => {
 *     const { data, count } = await supabase
 *       .from('conversations')
 *       .select('*', { count: 'exact' })
 *       .range(offset, offset + limit - 1);
 *     return { data: data || [], count: count || 0 };
 *   },
 *   pageSize: 50
 * });
 */
export function usePaginatedQuery<TData = unknown>(
  options: PaginatedQueryOptions<TData>
): PaginatedQueryResult<TData> {
  const {
    queryKey,
    queryFn,
    initialPage = 1,
    pageSize = PAGINATION.LIST_PAGE_SIZE,
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutos
    gcTime = 5 * 60 * 1000, // 5 minutos
  } = options;

  const pagination = usePagination({
    initialPage,
    pageSize,
  });

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: [...queryKey, pagination.page, pagination.pageSize],
    queryFn: () => queryFn({
      page: pagination.page,
      limit: pagination.pageSize,
      offset: pagination.offset,
    }),
    enabled: enabled && pagination.pageSize > 0,
    staleTime,
    gcTime,
  });

  // Atualizar total quando dados são recebidos
  if (data?.count !== undefined && data.count !== pagination.total) {
    pagination.setTotal(data.count);
  }

  return {
    ...pagination,
    data: data?.data || [],
    isLoading,
    isError,
    error: error as Error | null,
    isFetching,
    refetch: () => {
      refetch();
    },
  };
}

