import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, Smartphone, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWASettings = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Verifica se está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Captura evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Monitora status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error("O app não pode ser instalado neste momento");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success("App instalado com sucesso!");
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      toast.success("Cache limpo com sucesso!");
      
      // Recarrega a página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Progressive Web App (PWA)
              </CardTitle>
              <CardDescription>
                Instale o app no seu dispositivo para acesso rápido
              </CardDescription>
            </div>
            {isInstalled && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Instalado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isInstalled ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Instalar o app permite:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Acesso rápido pela tela inicial</li>
                <li>Funciona offline</li>
                <li>Notificações push</li>
                <li>Experiência como app nativo</li>
              </ul>
              <Button 
                onClick={handleInstall}
                disabled={!deferredPrompt}
                className="w-full mt-4"
              >
                <Download className="mr-2 h-4 w-4" />
                {deferredPrompt ? "Instalar App" : "App não disponível para instalação"}
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              O app está instalado no seu dispositivo. Você pode acessá-lo pela tela inicial.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
            Status de Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {isOnline ? "Online" : "Offline"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline 
                  ? "Conectado à internet" 
                  : "Usando modo offline - alguns recursos podem estar limitados"
                }
              </p>
            </div>
            <Badge variant={isOnline ? "secondary" : "destructive"}>
              {isOnline ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache e Dados</CardTitle>
          <CardDescription>
            Gerenciar dados armazenados localmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={clearCache}
            variant="outline"
            className="w-full"
          >
            Limpar Cache
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Isso removerá todos os dados em cache e recarregará a página
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
