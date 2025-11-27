import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-webhook`;

  useEffect(() => {
    loadSettings();
  }, [open]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('evolution_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copiada para a área de transferência");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações da Evolution API</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : settings ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Instância</Label>
                  <Input value={settings.instance_name} disabled />
                </div>
                
                <div>
                  <Label>URL da API</Label>
                  <Input value={settings.api_url} disabled />
                </div>
                
                <div>
                  <Label>Status da Conexão</Label>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${settings.is_connected ? 'bg-success' : 'bg-destructive'}`} />
                    <span>{settings.is_connected ? 'Conectado' : 'Desconectado'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label className="text-lg font-semibold">URL do Webhook</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Configure esta URL no painel da Evolution API para receber mensagens
                  </p>
                  <div className="flex gap-2">
                    <Input value={webhookUrl} disabled className="font-mono text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Como configurar o webhook:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Acesse o painel da Evolution API</li>
                    <li>Vá para a configuração da sua instância</li>
                    <li>Adicione a URL do webhook acima</li>
                    <li>Configure o evento "messages.upsert"</li>
                    <li>Salve as configurações</li>
                  </ol>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma configuração encontrada. Configure a Evolution API primeiro.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
