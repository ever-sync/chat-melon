import { useEffect, useState } from 'react';
import { Settings, Volume2, Bell, Moon, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type NotificationSettings = {
  volume: number;
  enabled: boolean;
  sound_enabled: boolean;
  badge_enabled: boolean;
  muted_contacts: string[];
  do_not_disturb_enabled: boolean;
  do_not_disturb_start: string;
  do_not_disturb_end: string;
};

export const NotificationSettingsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    volume: 0.5,
    enabled: true,
    sound_enabled: true,
    badge_enabled: true,
    muted_contacts: [],
    do_not_disturb_enabled: false,
    do_not_disturb_start: '22:00',
    do_not_disturb_end: '08:00',
  });
  const [newMutedContact, setNewMutedContact] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!companyMember) return;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyMember.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          volume: Number(data.volume),
          enabled: data.enabled,
          sound_enabled: data.sound_enabled,
          badge_enabled: data.badge_enabled,
          muted_contacts: data.muted_contacts || [],
          do_not_disturb_enabled: data.do_not_disturb_enabled,
          do_not_disturb_start: data.do_not_disturb_start,
          do_not_disturb_end: data.do_not_disturb_end,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!companyMember) return;

      const { error } = await supabase.from('notification_settings').upsert(
        {
          user_id: user.id,
          company_id: companyMember.company_id,
          ...settings,
        },
        {
          onConflict: 'user_id,company_id',
        }
      );

      if (error) throw error;

      toast.success('Configurações de notificações foram atualizadas');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Não foi possível salvar as configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const addMutedContact = () => {
    if (newMutedContact.trim() && !settings.muted_contacts.includes(newMutedContact)) {
      setSettings((prev) => ({
        ...prev,
        muted_contacts: [...prev.muted_contacts, newMutedContact.trim()],
      }));
      setNewMutedContact('');
    }
  };

  const removeMutedContact = (contact: string) => {
    setSettings((prev) => ({
      ...prev,
      muted_contacts: prev.muted_contacts.filter((c) => c !== contact),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de Notificações</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Notificações gerais */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label htmlFor="enabled">Notificações ativadas</Label>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Sons de notificação</Label>
                <Switch
                  id="sound"
                  checked={settings.sound_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, sound_enabled: checked }))
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="badge">Badge com contador</Label>
                <Switch
                  id="badge"
                  checked={settings.badge_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, badge_enabled: checked }))
                  }
                  disabled={!settings.enabled}
                />
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <Label>Volume: {Math.round(settings.volume * 100)}%</Label>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([value]) => setSettings((prev) => ({ ...prev, volume: value }))}
                min={0}
                max={1}
                step={0.1}
                disabled={!settings.enabled || !settings.sound_enabled}
              />
            </div>

            {/* Modo não perturbe */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label htmlFor="dnd">Modo Não Perturbe</Label>
                </div>
                <Switch
                  id="dnd"
                  checked={settings.do_not_disturb_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, do_not_disturb_enabled: checked }))
                  }
                />
              </div>

              {settings.do_not_disturb_enabled && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">De:</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={settings.do_not_disturb_start}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          do_not_disturb_start: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">Até:</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={settings.do_not_disturb_end}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          do_not_disturb_end: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contatos silenciados */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label>Contatos Silenciados</Label>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Número do contato"
                  value={newMutedContact}
                  onChange={(e) => setNewMutedContact(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMutedContact()}
                />
                <Button onClick={addMutedContact} size="sm">
                  Adicionar
                </Button>
              </div>

              {settings.muted_contacts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.muted_contacts.map((contact) => (
                    <Badge
                      key={contact}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeMutedContact(contact)}
                    >
                      {contact} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
