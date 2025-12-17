import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Configurações do hook useRateLimit
 */
interface UseRateLimitOptions {
  /** Número máximo de chamadas permitidas */
  maxCalls: number;
  /** Janela de tempo em milissegundos */
  windowMs: number;
  /** Mensagem customizada ao exceder o limite */
  errorMessage?: string;
  /** Callback quando o limite é excedido */
  onLimitExceeded?: () => void;
}

/**
 * Resultado do hook useRateLimit
 */
interface UseRateLimitResult {
  /** Verifica se a ação é permitida e registra a chamada */
  isAllowed: () => boolean;
  /** Número de chamadas restantes na janela atual */
  remaining: () => number;
  /** Tempo em ms até a janela resetar */
  resetIn: () => number;
  /** Reseta o contador manualmente */
  reset: () => void;
}

/**
 * Hook para rate limiting de ações no frontend
 * Previne spam de requisições e abuso de APIs
 *
 * @param options - Configurações de rate limiting
 * @returns Objeto com funções de controle
 *
 * @example
 * ```tsx
 * // Limitar envio de mensagens a 10 por minuto
 * function ChatInput() {
 *   const { isAllowed } = useRateLimit({
 *     maxCalls: 10,
 *     windowMs: 60000, // 1 minuto
 *     errorMessage: 'Você está enviando mensagens muito rápido. Aguarde um momento.',
 *   });
 *
 *   const handleSend = () => {
 *     if (!isAllowed()) {
 *       return; // Toast já é mostrado automaticamente
 *     }
 *     sendMessage(text);
 *   };
 *
 *   return <Button onClick={handleSend}>Enviar</Button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Limitar tentativas de login a 5 por 5 minutos
 * function LoginForm() {
 *   const { isAllowed, remaining, resetIn } = useRateLimit({
 *     maxCalls: 5,
 *     windowMs: 5 * 60 * 1000,
 *     errorMessage: 'Muitas tentativas de login. Tente novamente mais tarde.',
 *   });
 *
 *   const handleLogin = async () => {
 *     if (!isAllowed()) {
 *       const minutes = Math.ceil(resetIn() / 60000);
 *       toast.error(`Aguarde ${minutes} minutos antes de tentar novamente`);
 *       return;
 *     }
 *
 *     await login(credentials);
 *   };
 *
 *   return (
 *     <form onSubmit={handleLogin}>
 *       <p>Tentativas restantes: {remaining()}</p>
 *     </form>
 *   );
 * }
 * ```
 */
export function useRateLimit(options: UseRateLimitOptions): UseRateLimitResult {
  const {
    maxCalls,
    windowMs,
    errorMessage = 'Você está fazendo muitas requisições. Por favor, aguarde um momento.',
    onLimitExceeded,
  } = options;

  const callTimestamps = useRef<number[]>([]);

  /**
   * Remove timestamps fora da janela de tempo
   */
  const cleanupOldCalls = useCallback(() => {
    const now = Date.now();
    callTimestamps.current = callTimestamps.current.filter(
      (timestamp) => now - timestamp < windowMs
    );
  }, [windowMs]);

  /**
   * Verifica se a chamada é permitida
   */
  const isAllowed = useCallback(() => {
    cleanupOldCalls();

    if (callTimestamps.current.length >= maxCalls) {
      toast.error(errorMessage);
      onLimitExceeded?.();
      return false;
    }

    callTimestamps.current.push(Date.now());
    return true;
  }, [cleanupOldCalls, maxCalls, errorMessage, onLimitExceeded]);

  /**
   * Retorna número de chamadas restantes
   */
  const remaining = useCallback(() => {
    cleanupOldCalls();
    return Math.max(0, maxCalls - callTimestamps.current.length);
  }, [cleanupOldCalls, maxCalls]);

  /**
   * Retorna tempo até reset em ms
   */
  const resetIn = useCallback(() => {
    cleanupOldCalls();

    if (callTimestamps.current.length === 0) {
      return 0;
    }

    const oldestCall = Math.min(...callTimestamps.current);
    const resetTime = oldestCall + windowMs;
    return Math.max(0, resetTime - Date.now());
  }, [cleanupOldCalls, windowMs]);

  /**
   * Reseta o contador manualmente
   */
  const reset = useCallback(() => {
    callTimestamps.current = [];
  }, []);

  return {
    isAllowed,
    remaining,
    resetIn,
    reset,
  };
}

/**
 * Hook para throttling de funções
 * Garante que a função seja executada no máximo uma vez por intervalo
 *
 * @param callback - Função a ser throttled
 * @param delay - Delay em milissegundos
 * @returns Função throttled
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const throttledSearch = useThrottle((term: string) => {
 *     searchAPI(term);
 *   }, 1000);
 *
 *   return (
 *     <Input onChange={(e) => throttledSearch(e.target.value)} />
 *   );
 * }
 * ```
 */
export function useThrottle<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
) {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        // Agenda execução para quando o delay expirar
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () => {
            callback(...args);
            lastRun.current = Date.now();
          },
          delay - timeSinceLastRun
        );
      }
    },
    [callback, delay]
  );
}

/**
 * Hook para rate limiting com armazenamento persistente (localStorage)
 * Útil para limitar ações mesmo após reload da página
 *
 * @param key - Chave única para o localStorage
 * @param options - Configurações de rate limiting
 * @returns Objeto com funções de controle
 *
 * @example
 * ```tsx
 * // Limitar envio de feedback a 1 por dia
 * function FeedbackForm() {
 *   const { isAllowed } = usePersistentRateLimit('feedback-submit', {
 *     maxCalls: 1,
 *     windowMs: 24 * 60 * 60 * 1000, // 24 horas
 *     errorMessage: 'Você já enviou feedback hoje. Tente novamente amanhã.',
 *   });
 *
 *   const handleSubmit = () => {
 *     if (!isAllowed()) return;
 *     submitFeedback(data);
 *   };
 *
 *   return <Button onClick={handleSubmit}>Enviar Feedback</Button>;
 * }
 * ```
 */
export function usePersistentRateLimit(
  key: string,
  options: UseRateLimitOptions
): UseRateLimitResult {
  const { maxCalls, windowMs, errorMessage, onLimitExceeded } = options;

  const getStoredCalls = useCallback((): number[] => {
    try {
      const stored = localStorage.getItem(`rate-limit-${key}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [key]);

  const setStoredCalls = useCallback(
    (calls: number[]) => {
      try {
        localStorage.setItem(`rate-limit-${key}`, JSON.stringify(calls));
      } catch {
        // Ignore localStorage errors
      }
    },
    [key]
  );

  const cleanupOldCalls = useCallback(() => {
    const now = Date.now();
    const calls = getStoredCalls().filter((timestamp) => now - timestamp < windowMs);
    setStoredCalls(calls);
    return calls;
  }, [getStoredCalls, setStoredCalls, windowMs]);

  const isAllowed = useCallback(() => {
    const calls = cleanupOldCalls();

    if (calls.length >= maxCalls) {
      toast.error(errorMessage || 'Limite de requisições excedido');
      onLimitExceeded?.();
      return false;
    }

    const newCalls = [...calls, Date.now()];
    setStoredCalls(newCalls);
    return true;
  }, [cleanupOldCalls, maxCalls, errorMessage, onLimitExceeded, setStoredCalls]);

  const remaining = useCallback(() => {
    const calls = cleanupOldCalls();
    return Math.max(0, maxCalls - calls.length);
  }, [cleanupOldCalls, maxCalls]);

  const resetIn = useCallback(() => {
    const calls = cleanupOldCalls();

    if (calls.length === 0) {
      return 0;
    }

    const oldestCall = Math.min(...calls);
    const resetTime = oldestCall + windowMs;
    return Math.max(0, resetTime - Date.now());
  }, [cleanupOldCalls, windowMs]);

  const reset = useCallback(() => {
    setStoredCalls([]);
  }, [setStoredCalls]);

  return {
    isAllowed,
    remaining,
    resetIn,
    reset,
  };
}
