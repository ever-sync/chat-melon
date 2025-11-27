import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface IdleWarningDialogProps {
  /** Se o diálogo está aberto */
  open: boolean;
  /** Tempo restante em segundos */
  remainingSeconds: number;
  /** Tempo total de aviso em segundos */
  totalSeconds?: number;
  /** Callback ao clicar em "Continuar Conectado" */
  onStayActive: () => void;
}

/**
 * Diálogo de aviso de inatividade
 * Mostra countdown antes do logout automático
 *
 * @example
 * ```tsx
 * function App() {
 *   const { showWarning, remainingTime, stayActive } = useIdleWarningModal({
 *     idleTimeoutMs: 30 * 60 * 1000,
 *     warningTimeMs: 60 * 1000,
 *     onLogout: logout,
 *   });
 *
 *   return (
 *     <>
 *       <YourApp />
 *       <IdleWarningDialog
 *         open={showWarning}
 *         remainingSeconds={Math.ceil(remainingTime / 1000)}
 *         totalSeconds={60}
 *         onStayActive={stayActive}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function IdleWarningDialog({
  open,
  remainingSeconds,
  totalSeconds = 60,
  onStayActive,
}: IdleWarningDialogProps) {
  const percentage = (remainingSeconds / totalSeconds) * 100;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0
      ? `${minutes} minuto${minutes !== 1 ? 's' : ''} e ${secs} segundo${secs !== 1 ? 's' : ''}`
      : `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <AlertDialogTitle>Você ainda está aí?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>
              Detectamos inatividade. Você será desconectado automaticamente em{' '}
              <strong className="text-foreground">{formatTime(remainingSeconds)}</strong> por
              segurança.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tempo restante</span>
                <span className="font-medium">{remainingSeconds}s</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            <p className="text-sm text-muted-foreground">
              Clique em "Continuar Conectado" para manter sua sessão ativa.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayActive} className="w-full sm:w-auto">
            Continuar Conectado
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
