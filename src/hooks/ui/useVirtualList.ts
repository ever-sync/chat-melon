import { useRef, useState, useEffect, useMemo } from 'react';

/**
 * Configurações do hook useVirtualList
 */
interface UseVirtualListOptions {
  /** Altura estimada de cada item em pixels */
  itemHeight: number;
  /** Número de items extras renderizados acima e abaixo da área visível (overscan) */
  overscan?: number;
  /** Altura do container (viewport) em pixels */
  containerHeight?: number;
}

/**
 * Resultado do hook useVirtualList
 */
interface UseVirtualListResult<T> {
  /** Items visíveis que devem ser renderizados */
  virtualItems: Array<{
    index: number;
    item: T;
    offsetTop: number;
  }>;
  /** Altura total da lista (para scrollbar correto) */
  totalHeight: number;
  /** Ref para o container scrollável */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Função para scroll programático até um index */
  scrollToIndex: (index: number) => void;
}

/**
 * Hook para virtualização de listas longas
 * Renderiza apenas os items visíveis + overscan para performance
 *
 * @param items - Array de items a serem virtualizados
 * @param options - Configurações de virtualização
 * @returns Objeto com items virtuais e utilidades
 *
 * @example
 * ```tsx
 * function ConversationList({ conversations }) {
 *   const { virtualItems, totalHeight, containerRef } = useVirtualList(
 *     conversations,
 *     { itemHeight: 72, overscan: 5 }
 *   );
 *
 *   return (
 *     <div ref={containerRef} style={{ height: '100vh', overflow: 'auto' }}>
 *       <div style={{ height: totalHeight, position: 'relative' }}>
 *         {virtualItems.map(({ index, item, offsetTop }) => (
 *           <div
 *             key={item.id}
 *             style={{
 *               position: 'absolute',
 *               top: offsetTop,
 *               height: 72,
 *               width: '100%',
 *             }}
 *           >
 *             <ConversationItem conversation={item} />
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions
): UseVirtualListResult<T> {
  const { itemHeight, overscan = 5, containerHeight } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(containerHeight || 0);

  // Atualiza altura do viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setViewportHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Atualiza scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Calcula items visíveis
  const virtualItems = useMemo(() => {
    if (viewportHeight === 0) return [];

    const totalItems = items.length;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
    );

    const visible: Array<{ index: number; item: T; offsetTop: number }> = [];

    for (let i = startIndex; i <= endIndex; i++) {
      visible.push({
        index: i,
        item: items[i]!,
        offsetTop: i * itemHeight,
      });
    }

    return visible;
  }, [items, scrollTop, viewportHeight, itemHeight, overscan]);

  // Altura total da lista
  const totalHeight = items.length * itemHeight;

  // Scroll para um index específico
  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const offsetTop = index * itemHeight;
    container.scrollTo({ top: offsetTop, behavior: 'smooth' });
  };

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
  };
}

/**
 * Hook simplificado para listas com altura variável
 * Usa IntersectionObserver para detectar items visíveis
 *
 * @param items - Array de items
 * @param options - Configurações
 * @returns Items visíveis
 *
 * @example
 * ```tsx
 * function MessageList({ messages }) {
 *   const { visibleItems, observerRef } = useIntersectionVirtualList(messages);
 *
 *   return (
 *     <div ref={observerRef}>
 *       {visibleItems.map(msg => (
 *         <MessageBubble key={msg.id} message={msg} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionVirtualList<T extends { id: string | number }>(
  items: T[],
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const { threshold = 0.1, rootMargin = '100px' } = options;

  const [visibleIds, setVisibleIds] = useState<Set<string | number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const id = entry.target.getAttribute('data-id');
            if (!id) return;

            if (entry.isIntersecting) {
              next.add(id);
            } else {
              next.delete(id);
            }
          });
          return next;
        });
      },
      { threshold, rootMargin }
    );

    return () => observerRef.current?.disconnect();
  }, [threshold, rootMargin]);

  const visibleItems = items.filter((item) => visibleIds.has(item.id));

  return {
    visibleItems,
    observerRef,
  };
}
