import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EvolutionQRCodeModal } from '@/components/evolution/EvolutionQRCodeModal';

export default function InstanceSetup() {
  const navigate = useNavigate();
  const [instanceName, setInstanceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Pegar companyId do localStorage
  const companyId = localStorage.getItem('currentCompanyId');

  const handleCreate = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    if (!companyId) {
      toast.error('Empresa não identificada. Por favor, selecione uma empresa primeiro.');
      navigate('/companies');
      return;
    }

    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke('evolution-instance-manager', {
        body: {
          action: 'create',
          companyId,
          instanceName: instanceName.trim(),
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      // Handle HTTP error responses (409, 500, etc)
      if (response.error) {
        const errorData = response.data as any;
        if (errorData?.error) {
          toast.error(errorData.error);
        } else {
          toast.error(response.error.message || 'Erro ao criar instância');
        }
        return;
      }

      if (!response.data?.success) {
        toast.error(response.data?.error || 'Erro ao criar instância');
        return;
      }

      toast.success('Instância criada! Escaneie o QR Code para conectar.');
      setShowQRModal(true);
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      const errorMessage = error?.message || 'Erro ao criar instância. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    navigate('/settings');
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Conectar WhatsApp</CardTitle>
          <CardDescription>
            Crie sua instância e escaneie o QR Code para conectar o WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              placeholder="Ex: Atendimento, Vendas, Suporte..."
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Escolha um nome identificador para esta instância WhatsApp
            </p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading || !instanceName.trim()}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Instância e Gerar QR Code
          </Button>
        </CardContent>
      </Card>

      {companyId && (
        <EvolutionQRCodeModal
          isOpen={showQRModal}
          onClose={handleQRModalClose}
          companyId={companyId}
        />
      )}
    </div>
  );
}
