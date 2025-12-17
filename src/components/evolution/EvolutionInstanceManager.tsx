import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, Trash2, Power } from 'lucide-react';
import { EvolutionStatusBadge } from './EvolutionStatusBadge';
import { EvolutionQRCodeModal } from './EvolutionQRCodeModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvolutionInstanceManagerProps {
  companyId: string;
  instanceName: string;
  instanceStatus: string;
  qrCode?: string | null;
  onStatusUpdate?: () => void;
}

export const EvolutionInstanceManager = ({
  companyId,
  instanceName,
  instanceStatus,
  qrCode,
  onStatusUpdate,
}: EvolutionInstanceManagerProps) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'check-status' | 'restart' | 'delete' | 'get-qrcode') => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('evolution-instance-manager', {
        body: {
          action,
          companyId,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      const messages = {
        'check-status': 'Status verificado',
        restart: 'Instância reiniciada',
        delete: 'Instância deletada',
        'get-qrcode': 'QR Code obtido',
      };

      toast.success(messages[action]);

      if (action === 'get-qrcode' && response.data?.qrCode) {
        setShowQRModal(true);
      }

      onStatusUpdate?.();
    } catch (error) {
      console.error(`Erro ao executar ${action}:`, error);
      toast.error('Erro ao executar ação');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar esta instância?')) return;
    await handleAction('delete');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instância Evolution API</CardTitle>
              <CardDescription>{instanceName}</CardDescription>
            </div>
            <EvolutionStatusBadge status={instanceStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleAction('get-qrcode')}
              disabled={loading || instanceStatus === 'not_created'}
              variant="outline"
              size="sm"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Ver QR Code
            </Button>

            <Button
              onClick={() => handleAction('check-status')}
              disabled={loading || instanceStatus === 'not_created'}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verificar Status
            </Button>

            <Button
              onClick={() => handleAction('restart')}
              disabled={loading || instanceStatus === 'not_created'}
              variant="outline"
              size="sm"
            >
              <Power className="h-4 w-4 mr-2" />
              Reiniciar
            </Button>

            <Button
              onClick={handleDelete}
              disabled={loading || instanceStatus === 'not_created'}
              variant="outline"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          </div>
        </CardContent>
      </Card>

      <EvolutionQRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        companyId={companyId}
        initialQrCode={qrCode}
      />
    </>
  );
};
