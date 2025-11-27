import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Configurações do hook useIdleTimeout
 */
interface UseIdleTimeoutOptions {
  /** Tempo de inatividade em milissegundos antes do timeout */
  timeoutMs: number;
  /** Callback chamado quando o timeout é atingido */
  onTimeout: () => void;
  /** Tempo de aviso antes do timeout (opcional) */
  warningMs?: number;
  /** Callback chamado no aviso (opcional) */
  onWarning?: () => void;
  /** Se deve pausar o timer (útil para desabilitar em certas páginas) */
  paused?: boolean;
  /** Eventos que resetam o timer */
  events?: string[];
}

/**
 * Hook para detectar inatividade do usuário e executar ação após timeout
 * Útil para logout automático por segurança
 *
 * @param options - Configurações do idle timeout
 *
 * @example
 * ```tsx
 * // Logout após 30 minutos de inatividade
 * function App() {
 *   const { logout } = useAuth();
 *
 *   useIdleTimeout({
 *     timeoutMs: 30 * 60 * 1000, // 30 minutos
 *     warningMs: 5 * 60 * 1000,  // Aviso 5 min antes
 *     onWarning: () => {
 *       toast.warning('Você será desconectado em 5 minutos por inatividade');
 *     },
 *     onTimeout: () => {
 *       toast.error('Sessão expirada por inatividade');
 *       logout();
 *     },
 *   });
 *
 *   return <YourApp />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Pausar timer em páginas específicas
 * function VideoPlayer() {
 *   const [isPlaying, setIsPlaying] = useState(false);
 *
 *   useIdleTimeout({
 *     timeoutMs: 30 * 60 * 1000,
 *     onTimeout: () => logout(),
 *     paused: isPlaying, // Não deslogar enquanto assiste vídeo
 *   });
 *
 *   return <Video onPlay={() => setIsPlaying(true)} />;
 * }
 * ```
 */
export function useIdleTimeout(options: UseIdleTimeoutOptions): void {
  const {
    timeoutMs,
    onTimeout,
    warningMs,
    onWarning,
    paused = false,
    events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'],
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const warningShownRef = useRef(false);

  /**
   * Reseta os timers de inatividade
   */
  const resetTimer = useCallback(() => {
    if (paused) return;

    // Limpa timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    warningShownRef.current = false;

    // Timer de aviso (se configurado)
    if (warningMs && onWarning) {
      const warningTime = timeoutMs - warningMs;
      warningTimeoutRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          onWarning();
        }
      }, warningTime);
    }

    // Timer de timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMs, warningMs, onWarning, onTimeout, paused]);

  useEffect(() => {
    // Não ativa se pausado
    if (paused) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      return;
    }

    // Inicia o timer
    resetTimer();

    // Adiciona event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, events, paused]);
}

/**
 * Hook mais simples que apenas detecta se o usuário está idle
 * Retorna true/false sem executar ações
 *
 * @param timeoutMs - Tempo de inatividade em ms
 * @returns Se o usuário está idle
 *
 * @example
 * ```tsx
 * function StatusIndicator() {
 *   const isIdle = useIsIdle(5 * 60 * 1000); // 5 minutos
 *
 *   return (
 *     <div>
 *       Status: {isIdle ? '😴 Ausente' : '🟢 Ativo'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsIdle(timeoutMs: number): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useIdleTimeout({
    timeoutMs,
    onTimeout: () => setIsIdle(true),
    events: ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'],
  });

  // Reseta idle status quando há atividade
  useEffect(() => {
    const resetIdle = () => setIsIdle(false);

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetIdle, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdle);
      });
    };
  }, []);

  return isIdle;
}

/**
 * Hook para mostrar modal de aviso antes do logout
 * com countdown e opção de "Continuar Conectado"
 *
 * @param options - Configurações
 * @returns Estado e ações do modal
 *
 * @example
 * ```tsx
 * function App() {
 *   const { logout } = useAuth();
 *   const { showWarning, remainingTime, stayActive } = useIdleWarningModal({
 *     idleTimeoutMs: 30 * 60 * 1000,
 *     warningTimeMs: 60 * 1000, // 1 minuto de aviso
 *     onLogout: logout,
 *   });
 *
 *   return (
 *     <>
 *       <YourApp />
 *       {showWarning && (
 *         <IdleWarningDialog
 *           remainingSeconds={Math.ceil(remainingTime / 1000)}
 *           onStayActive={stayActive}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useIdleWarningModal(options: {
  idleTimeoutMs: number;
  warningTimeMs: number;
  onLogout: () => void;
}) {
  const { idleTimeoutMs, warningTimeMs, onLogout } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(warningTimeMs);
  const countdownIntervalRef = useRef<NodeJS.Timeout>();

  useIdleTimeout({
    timeoutMs: idleTimeoutMs,
    warningMs: warningTimeMs,
    onWarning: () => {
      setShowWarning(true);
      setRemainingTime(warningTimeMs);

      // Countdown
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    },
    onTimeout: () => {
      setShowWarning(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      onLogout();
    },
  });

  const stayActive = useCallback(() => {
    setShowWarning(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    // Simula atividade do usuário para resetar timer
    window.dispatchEvent(new Event('mousedown'));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return {
    showWarning,
    remainingTime,
    stayActive,
  };
}
