import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Volume2, Moon, X, Save, Play } from 'lucide-react';
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

// Função para gerar um beep usando Web Audio API
const createBeepSound = (audioContext: AudioContext, volume: number): void => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 880; // Frequência em Hz (nota A5)
  oscillator.type = 'sine';

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
    do_not_disturb_start: '22:00',
    do_not_disturb_end: '08:00',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newMutedContact, setNewMutedContact] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Função para testar o som
  const testSound = useCallback(() => {
    const volume = settings.volume;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
      }

      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Se falhar, usar Web Audio API como fallback
        if (!audioContextRef.current) {
          audioContextRef.current = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        createBeepSound(audioContextRef.current, volume);
      });
    } catch (error) {
      // Usar beep como fallback
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (!companyData) return;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyData.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          volume: Number(data.volume),
          enabled: data.enabled ?? true,
          sound_enabled: data.sound_enabled ?? true,
          badge_enabled: data.badge_enabled ?? true,
          muted_contacts: data.muted_contacts || [],
          do_not_disturb_enabled: data.do_not_disturb_enabled ?? false,
          do_not_disturb_start: data.do_not_disturb_start || '22:00',
          do_not_disturb_end: data.do_not_disturb_end || '08:00',
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
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar empresa padrão ou atual
      const { data: companyData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (!companyData) throw new Error('Empresa não encontrada');

      const { error } = await supabase.from('notification_settings').upsert(
        {
          user_id: user.id,
          company_id: companyData.company_id,
          volume: settings.volume,
          enabled: settings.enabled,
          sound_enabled: settings.sound_enabled,
          badge_enabled: settings.badge_enabled,
          muted_contacts: settings.muted_contacts,
          do_not_disturb_enabled: settings.do_not_disturb_enabled,
          do_not_disturb_start: settings.do_not_disturb_start,
          do_not_disturb_end: settings.do_not_disturb_end,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,company_id',
        }
      );

      if (error) throw error;

      toast.success('Configurações salvas', {
        description: 'Suas preferências de notificação foram atualizadas.'
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar', {
        description: error.message || 'Ocorreu um erro ao salvar suas preferências.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addMutedContact = () => {
    if (!newMutedContact.trim()) return;
    if (settings.muted_contacts.includes(newMutedContact)) {
      toast.error('Contato já está silenciado');
      return;
    }
    setSettings({
      ...settings,
      muted_contacts: [...settings.muted_contacts, newMutedContact],
    });
    setNewMutedContact('');
  };

  const removeMutedContact = (contact: string) => {
    setSettings({
      ...settings,
      muted_contacts: settings.muted_contacts.filter((c) => c !== contact),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-8 rounded-3xl border border-indigo-100/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-50">
            <Bell className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Notificações</h2>
            <p className="text-gray-500">Gerencie como e quando você deseja ser notificado</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Configurações Gerais */}
          <Card className="border-0 shadow-xl shadow-indigo-500/5 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md border-t border-white/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Bell className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Notificações Gerais</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-transparent transition-all hover:bg-white hover:border-indigo-100 hover:shadow-sm">
                <div>
                  <Label htmlFor="enabled" className="text-base font-semibold cursor-pointer">Ativar notificações</Label>
                  <p className="text-sm text-gray-500">Alertas globais sobre o sistema</p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-transparent transition-all hover:bg-white hover:border-indigo-100 hover:shadow-sm">
                <div>
                  <Label htmlFor="sound" className="text-base font-semibold cursor-pointer">Som de notificação</Label>
                  <p className="text-sm text-gray-500">Feedback sonoro para novos eventos</p>
                </div>
                <Switch
                  id="sound"
                  checked={settings.sound_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, sound_enabled: checked })}
                  disabled={!settings.enabled}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              {settings.sound_enabled && (
                <div className="space-y-4 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-indigo-600" />
                      <Label className="text-sm font-medium">Volume: {Math.round(settings.volume * 100)}%</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={testSound}
                      disabled={!settings.enabled || !settings.sound_enabled}
                      className="h-8 px-3 rounded-lg hover:bg-indigo-100 text-indigo-600 font-medium"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Testar
                    </Button>
                  </div>
                  <Slider
                    value={[settings.volume]}
                    onValueChange={(value) => setSettings({ ...settings, volume: value[0] })}
                    max={1}
                    step={0.01}
                    disabled={!settings.enabled || !settings.sound_enabled}
                    className="cursor-pointer py-2"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-transparent transition-all hover:bg-white hover:border-indigo-100 hover:shadow-sm">
                <div>
                  <Label htmlFor="badge" className="text-base font-semibold cursor-pointer">Badge de contador</Label>
                  <p className="text-sm text-gray-500">Ícone no dock com total de não lidas</p>
                </div>
                <Switch
                  id="badge"
                  checked={settings.badge_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, badge_enabled: checked })}
                  disabled={!settings.enabled}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Não Perturbe */}
          <Card className="border-0 shadow-xl shadow-purple-500/5 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md border-t border-white/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Moon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Não Perturbe</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-transparent transition-all hover:bg-white hover:border-purple-100 hover:shadow-sm">
                <div>
                  <Label htmlFor="dnd" className="text-base font-semibold cursor-pointer">Ativar Não Perturbe</Label>
                  <p className="text-sm text-gray-500">Silenciar durante horários específicos</p>
                </div>
                <Switch
                  id="dnd"
                  checked={settings.do_not_disturb_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, do_not_disturb_enabled: checked })
                  }
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              {settings.do_not_disturb_enabled && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-purple-50/30 border border-purple-100/50">
                  <div className="space-y-2">
                    <Label htmlFor="dnd-start" className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Início</Label>
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
                      className="bg-white border-purple-100 rounded-xl focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dnd-end" className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Fim</Label>
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
                      className="bg-white border-purple-100 rounded-xl focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contatos Silenciados */}
          <Card className="border-0 shadow-xl shadow-red-500/5 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md border-t border-white/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <X className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">Contatos Silenciados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Número (Ex: 5511999999999)"
                  value={newMutedContact}
                  onChange={(e) => setNewMutedContact(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addMutedContact();
                    }
                  }}
                  className="rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all h-11"
                />
                <Button 
                  onClick={addMutedContact}
                  className="rounded-2xl px-6 bg-gray-900 hover:bg-black text-white h-11 transition-all active:scale-95"
                >
                  Adicionar
                </Button>
              </div>

              {settings.muted_contacts.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {settings.muted_contacts.map((contact) => (
                    <Badge key={contact} variant="secondary" className="gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm transition-all hover:bg-red-50 hover:border-red-100 hover:text-red-700 group">
                      <span className="font-medium">{contact}</span>
                      <X
                        className="h-3.5 w-3.5 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMutedContact(contact)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {settings.muted_contacts.length === 0 && (
                <div className="text-center py-6 px-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                  <p className="text-sm text-gray-400">Nenhum contato silenciado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={saveSettings} 
          disabled={isSaving} 
          className="rounded-2xl h-14 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 font-bold text-lg"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Salvar Configurações
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};
