import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  total?: number;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
}

/**
 * Hook genérico para gerenciar estado de paginação
 * 
 * @example
 * const { page, pageSize, offset, nextPage, prevPage } = usePagination({
 *   initialPage: 1,
 *   pageSize: 50,
 *   total: 1000
 * });
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, pageSize: initialPageSize = 50, total: initialTotal = 0 } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const offset = useMemo(() => {
    return (page - 1) * pageSize;
  }, [page, pageSize]);

  const hasNext = useMemo(() => {
    return page < totalPages;
  }, [page, totalPages]);

  const hasPrev = useMemo(() => {
    return page > 1;
  }, [page]);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    // Ajustar página atual se necessário
    setPage((prev) => {
      const newTotalPages = Math.ceil(total / size);
      return Math.min(prev, newTotalPages);
    });
  }, [total]);

  return {
    page,
    pageSize,
    total,
    totalPages,
    offset,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    setTotal,
  };
}

