import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Útil para otimizar buscas e evitar chamadas excessivas de API
 *
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos (padrão: 300ms)
 * @returns Valor debounced
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearch = useDebounce(searchTerm, 500);
 *
 *   useEffect(() => {
 *     // Essa função só executa 500ms após o usuário parar de digitar
 *     if (debouncedSearch) {
 *       searchAPI(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="Buscar..."
 *     />
 *   );
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Cria um timer que atualiza o valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timer se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de funções (callback)
 * Útil quando você quer debounce da execução da função, não do valor
 *
 * @param callback - Função a ser debounced
 * @param delay - Delay em milissegundos (padrão: 300ms)
 * @returns Função debounced
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const debouncedSearch = useDebouncedCallback(
 *     (term: string) => {
 *       searchAPI(term);
 *     },
 *     500
 *   );
 *
 *   return (
 *     <input
 *       onChange={(e) => debouncedSearch(e.target.value)}
 *       placeholder="Buscar..."
 *     />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number = 300
) {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (...args: Args) => {
    const timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    return () => clearTimeout(timeoutId);
  };
}
