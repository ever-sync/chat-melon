import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { Separator } from "@/components/ui/separator";

type VisibilityOption = 'everyone' | 'contacts' | 'nobody';

interface PrivacySettings {
  show_profile_picture: VisibilityOption;
  show_status: VisibilityOption;
  show_last_seen: VisibilityOption;
  read_receipts_enabled: boolean;
  who_can_add_to_groups: VisibilityOption;
}

export function PrivacySettings() {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    show_profile_picture: 'everyone',
    show_status: 'everyone',
    show_last_seen: 'everyone',
    read_receipts_enabled: true,
    who_can_add_to_groups: 'everyone',
  });

  useEffect(() => {
    loadSettings();
  }, [currentCompany]);

  const loadSettings = async () => {
    if (!currentCompany) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', currentCompany.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading privacy settings:', error);
      return;
    }

    if (data) {
      setSettings({
        show_profile_picture: data.show_profile_picture as VisibilityOption,
        show_status: data.show_status as VisibilityOption,
        show_last_seen: data.show_last_seen as VisibilityOption,
        read_receipts_enabled: data.read_receipts_enabled,
        who_can_add_to_groups: data.who_can_add_to_groups as VisibilityOption,
      });
    }
  };

  const handleSave = async () => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('privacy_settings')
      .upsert({
        user_id: user.id,
        company_id: currentCompany.id,
        ...settings,
      }, {
        onConflict: 'user_id,company_id'
      });

    if (error) {
      toast.error("Erro ao salvar configurações de privacidade");
      console.error('Error saving privacy settings:', error);
    } else {
      toast.success("Configurações de privacidade atualizadas");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Privacidade</CardTitle>
        <CardDescription>
          Controle quem pode ver suas informações e como você interage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-picture">Foto de Perfil</Label>
            <Select
              value={settings.show_profile_picture}
              onValueChange={(value) => setSettings({ ...settings, show_profile_picture: value as VisibilityOption })}
            >
              <SelectTrigger id="profile-picture">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Todos</SelectItem>
                <SelectItem value="contacts">Meus Contatos</SelectItem>
                <SelectItem value="nobody">Ninguém</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Quem pode ver sua foto de perfil
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Recados/Status</Label>
            <Select
              value={settings.show_status}
              onValueChange={(value) => setSettings({ ...settings, show_status: value as VisibilityOption })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Todos</SelectItem>
                <SelectItem value="contacts">Meus Contatos</SelectItem>
                <SelectItem value="nobody">Ninguém</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Quem pode ver seus recados e status
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last-seen">Visto por Último</Label>
            <Select
              value={settings.show_last_seen}
              onValueChange={(value) => setSettings({ ...settings, show_last_seen: value as VisibilityOption })}
            >
              <SelectTrigger id="last-seen">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Todos</SelectItem>
                <SelectItem value="contacts">Meus Contatos</SelectItem>
                <SelectItem value="nobody">Ninguém</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Quem pode ver quando você esteve online pela última vez
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="read-receipts">Confirmação de Leitura</Label>
            <p className="text-xs text-muted-foreground">
              Enviar e receber confirmações de leitura
            </p>
          </div>
          <Switch
            id="read-receipts"
            checked={settings.read_receipts_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, read_receipts_enabled: checked })}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="groups">Grupos</Label>
          <Select
            value={settings.who_can_add_to_groups}
            onValueChange={(value) => setSettings({ ...settings, who_can_add_to_groups: value as VisibilityOption })}
          >
            <SelectTrigger id="groups">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Todos</SelectItem>
              <SelectItem value="contacts">Meus Contatos</SelectItem>
              <SelectItem value="nobody">Ninguém</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Quem pode adicionar você em grupos
          </p>
        </div>

        <Separator />

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
