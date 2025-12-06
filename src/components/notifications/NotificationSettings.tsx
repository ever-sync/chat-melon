import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Volume2, Moon, X, Save, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// Função para gerar um beep usando Web Audio API
const createBeepSound = (audioContext: AudioContext, volume: number): void => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 880; // Frequência em Hz (nota A5)
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

export const NotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    volume: 0.5,
    enabled: true,
    sound_enabled: true,
    badge_enabled: true,
    muted_contacts: [],
    do_not_disturb_enabled: false,
    do_not_disturb_start: "22:00",
    do_not_disturb_end: "08:00",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newMutedContact, setNewMutedContact] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Função para testar o som
  const testSound = useCallback(() => {
    const volume = settings.volume;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notification.mp3");
      }

      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Se falhar, usar Web Audio API como fallback
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
        createBeepSound(audioContextRef.current, volume);
      });
    } catch (error) {
      // Usar beep como fallback
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      createBeepSound(audioContextRef.current, volume);
    }
  }, [settings.volume]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (!companyData) return;

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .eq("company_id", companyData.company_id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          volume: Number(data.volume),
          enabled: data.enabled ?? true,
          sound_enabled: data.sound_enabled ?? true,
          badge_enabled: data.badge_enabled ?? true,
          muted_contacts: data.muted_contacts || [],
          do_not_disturb_enabled: data.do_not_disturb_enabled ?? false,
          do_not_disturb_start: data.do_not_disturb_start || "22:00",
          do_not_disturb_end: data.do_not_disturb_end || "08:00",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (!companyData) throw new Error("Empresa não encontrada");

      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: user.id,
          company_id: companyData.company_id,
          ...settings,
        }, {
          onConflict: "user_id,company_id",
        });

      if (error) throw error;

      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const addMutedContact = () => {
    if (!newMutedContact.trim()) return;
    if (settings.muted_contacts.includes(newMutedContact)) {
      toast.error("Contato já está silenciado");
      return;
    }
    setSettings({
      ...settings,
      muted_contacts: [...settings.muted_contacts, newMutedContact],
    });
    setNewMutedContact("");
  };

  const removeMutedContact = (contact: string) => {
    setSettings({
      ...settings,
      muted_contacts: settings.muted_contacts.filter((c) => c !== contact),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificações Gerais</CardTitle>
          </div>
          <CardDescription>
            Configure como você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Ativar notificações</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre novas mensagens e eventos
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound">Som de notificação</Label>
              <p className="text-sm text-muted-foreground">
                Tocar som quando receber notificações
              </p>
            </div>
            <Switch
              id="sound"
              checked={settings.sound_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, sound_enabled: checked })
              }
              disabled={!settings.enabled}
            />
          </div>

          {settings.sound_enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Label>Volume: {Math.round(settings.volume * 100)}%</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testSound}
                    disabled={!settings.enabled || !settings.sound_enabled}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Testar Som
                  </Button>
                </div>
                <Slider
                  value={[settings.volume]}
                  onValueChange={(value) =>
                    setSettings({ ...settings, volume: value[0] })
                  }
                  max={1}
                  step={0.1}
                  disabled={!settings.enabled || !settings.sound_enabled}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="badge">Badge de contador</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar número de notificações não lidas
              </p>
            </div>
            <Switch
              id="badge"
              checked={settings.badge_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, badge_enabled: checked })
              }
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            <CardTitle>Não Perturbe</CardTitle>
          </div>
          <CardDescription>
            Silencie notificações em horários específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dnd">Ativar Não Perturbe</Label>
              <p className="text-sm text-muted-foreground">
                Silenciar notificações durante o período definido
              </p>
            </div>
            <Switch
              id="dnd"
              checked={settings.do_not_disturb_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, do_not_disturb_enabled: checked })
              }
            />
          </div>

          {settings.do_not_disturb_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dnd-start">Início</Label>
                <Input
                  id="dnd-start"
                  type="time"
                  value={settings.do_not_disturb_start}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      do_not_disturb_start: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dnd-end">Fim</Label>
                <Input
                  id="dnd-end"
                  type="time"
                  value={settings.do_not_disturb_end}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      do_not_disturb_end: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatos Silenciados</CardTitle>
          <CardDescription>
            Contatos que não enviarão notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Número do contato (ex: 5511999999999)"
              value={newMutedContact}
              onChange={(e) => setNewMutedContact(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addMutedContact();
                }
              }}
            />
            <Button onClick={addMutedContact}>Adicionar</Button>
          </div>

          {settings.muted_contacts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.muted_contacts.map((contact) => (
                <Badge key={contact} variant="secondary" className="gap-1">
                  {contact}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeMutedContact(contact)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {settings.muted_contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum contato silenciado
            </p>
          )}
        </CardContent>
      </Card>

      <Button onClick={saveSettings} disabled={isSaving} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
};
