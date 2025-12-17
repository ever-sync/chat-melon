import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePWA } from '@/hooks/usePWA';

/**
 * Prompt para atualizar quando nova versão disponível
 */
export const UpdatePrompt = () => {
  const { updateAvailable, update } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShow(true);
    }
  }, [updateAvailable]);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Alert className="border-primary bg-background shadow-lg">
        <RefreshCw className="h-5 w-5 text-primary" />
        <AlertDescription className="ml-2 flex items-center justify-between gap-2">
          <div className="flex-1">
            <p className="font-semibold mb-1">Nova Versão Disponível</p>
            <p className="text-sm text-muted-foreground">
              Uma atualização está pronta. Clique para atualizar.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              update();
              setShow(false);
            }}
          >
            Atualizar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
