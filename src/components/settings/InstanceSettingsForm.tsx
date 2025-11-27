import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface InstanceSettings {
  reject_call: boolean;
  msg_call: string;
  groups_ignore: boolean;
  always_online: boolean;
  read_messages: boolean;
  read_status: boolean;
  sync_full_history: boolean;
}

export function InstanceSettingsForm({ companyId }: { companyId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<InstanceSettings>({
    reject_call: false,
    msg_call: '',
    groups_ignore: false,
    always_online: false,
    read_messages: false,
    read_status: false,
    sync_full_history: false,
  });

  useEffect(() => {
    loadSettings();
  }, [companyId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-settings', {
        body: { companyId, action: 'get' }
      });

      if (data && !error) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Erro ao carregar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('evolution-settings', {
        body: { companyId, action: 'set', settings }
      });

      if (error) throw error;

      toast.success('As configurações da instância foram atualizadas');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Instância</CardTitle>
        <CardDescription>
          Configure o comportamento do seu WhatsApp conectado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Sempre Online */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Sempre Online</Label>
            <p className="text-sm text-muted-foreground">
              Mantém o WhatsApp sempre mostrando "online"
            </p>
          </div>
          <Switch
            checked={settings.always_online}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, always_online: checked }))}
          />
        </div>

        {/* Marcar mensagens como lidas */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Marcar como Lido</Label>
            <p className="text-sm text-muted-foreground">
              Envia confirmação de leitura automaticamente
            </p>
          </div>
          <Switch
            checked={settings.read_messages}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, read_messages: checked }))}
          />
        </div>

        {/* Ignorar grupos */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Ignorar Grupos</Label>
            <p className="text-sm text-muted-foreground">
              Não receber mensagens de grupos
            </p>
          </div>
          <Switch
            checked={settings.groups_ignore}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, groups_ignore: checked }))}
          />
        </div>

        {/* Rejeitar chamadas */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Rejeitar Chamadas</Label>
            <p className="text-sm text-muted-foreground">
              Rejeita chamadas automaticamente e envia mensagem
            </p>
          </div>
          <Switch
            checked={settings.reject_call}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, reject_call: checked }))}
          />
        </div>

        {settings.reject_call && (
          <div>
            <Label>Mensagem ao Rejeitar</Label>
            <Input
              value={settings.msg_call}
              onChange={(e) => setSettings(s => ({ ...s, msg_call: e.target.value }))}
              placeholder="No momento não posso atender. Envie uma mensagem!"
            />
          </div>
        )}

        <Button onClick={saveSettings} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
