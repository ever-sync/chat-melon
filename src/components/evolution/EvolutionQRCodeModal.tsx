import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EvolutionQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  initialQrCode?: string | null;
}

export const EvolutionQRCodeModal = ({ 
  isOpen, 
  onClose, 
  companyId,
  initialQrCode 
}: EvolutionQRCodeModalProps) => {
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode || null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen && !isConnected) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            refreshQRCode();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      const statusChecker = setInterval(() => {
        checkConnectionStatus();
      }, 3000);

      return () => {
        clearInterval(timer);
        clearInterval(statusChecker);
      };
    }
  }, [isOpen, isConnected]);

  const refreshQRCode = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('evolution-instance-manager', {
        body: {
          action: 'get-qrcode',
          companyId,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      
      if (response.data?.qrCode) {
        setQrCode(response.data.qrCode);
        setTimeLeft(60);
        toast.success('QR Code atualizado');
      }
    } catch (error) {
      console.error('Erro ao atualizar QR Code:', error);
      toast.error('Erro ao atualizar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      setChecking(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('evolution-instance-manager', {
        body: {
          action: 'check-status',
          companyId,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      
      if (response.data?.isConnected) {
        setIsConnected(true);
        toast.success('WhatsApp conectado com sucesso!');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyQRCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      toast.success('QR Code copiado');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu WhatsApp para conectar a instância
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isConnected ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-lg font-semibold text-green-500">Conectado com sucesso!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center bg-card p-4 rounded-lg border">
                {qrCode ? (
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="w-64 h-64 object-contain"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-muted-foreground">
                    <p>Carregando QR Code...</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Expira em: <span className="font-semibold">{timeLeft}s</span>
                  </span>
                  {checking && (
                    <span className="text-xs text-muted-foreground">
                      Verificando conexão...
                    </span>
                  )}
                </div>

                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em Menu ou Configurações e selecione Aparelhos conectados</li>
                  <li>Toque em Conectar um aparelho</li>
                  <li>Aponte seu celular para esta tela para capturar o QR Code</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={refreshQRCode}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar QR
                </Button>
                <Button
                  onClick={copyQRCode}
                  variant="outline"
                  size="icon"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};