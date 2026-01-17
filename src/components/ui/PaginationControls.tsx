import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showInfo?: boolean;
  className?: string;
}

/**
 * Componente completo de paginação com controles
 * 
 * @example
 * <PaginationControls
 *   page={1}
 *   pageSize={50}
 *   total={1000}
 *   totalPages={20}
 *   hasNext={true}
 *   hasPrev={false}
 *   onPageChange={(page) => setPage(page)}
 *   onPageSizeChange={(size) => setPageSize(size)}
 * />
 */
export function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  showInfo = true,
  className,
  compact = false,
}: PaginationControlsProps & { compact?: boolean }) {
  const getVisiblePages = () => {
    const delta = compact ? 1 : 2; // Menos páginas visíveis no modo compacto
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, 'ellipsis-start');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('ellipsis-end', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Layout classes depend on compact mode
  const containerClasses = compact
    ? `flex flex-col gap-3 items-center w-full ${className || ''}`
    : `flex flex-col gap-4 items-center sm:flex-row sm:justify-between ${className || ''}`;

  const infoClasses = compact
    ? "text-xs text-muted-foreground text-center w-full order-1"
    : "text-sm text-muted-foreground whitespace-nowrap";
    
  const controlsClasses = compact
    ? "flex flex-wrap items-center justify-between gap-2 w-full order-2"
    : "flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto";

  return (
    <div className={containerClasses}>
      {showInfo && (
        <div className={infoClasses}>
          Mostrando <span className="font-medium text-foreground">{startItem}</span> a <span className="font-medium text-foreground">{endItem}</span> de <span className="font-medium text-foreground">{total}</span>
        </div>
      )}

      <div className={controlsClasses}>
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            {!compact && <span className="text-sm text-muted-foreground">Por página:</span>}
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Pagination className={compact ? "flex-1 justify-end mx-0 w-auto" : ""}>
          <PaginationContent className="flex-wrap justify-center gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => hasPrev && onPageChange(page - 1)}
                className={!hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                compact={compact}
              />
            </PaginationItem>

            {visiblePages.map((pageNum, index) => {
              if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              const pageNumber = pageNum as number;
              const isActive = pageNumber === page;

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNumber)}
                    isActive={isActive}
                    className={isActive ? '' : 'cursor-pointer'}
                    size={compact ? "sm" : "icon"}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => hasNext && onPageChange(page + 1)}
                className={!hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                compact={compact}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

