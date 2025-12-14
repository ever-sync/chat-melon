import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  MessageCircle,
  Palette,
  Settings,
  Clock,
  Code,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Loader2,
} from 'lucide-react';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const WidgetSettings = () => {
  const { settings, isLoading, createSettings, updateSettings, generateEmbedCode, hasSettings } = useWidgetSettings();
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    enabled: settings?.enabled ?? true,
    primary_color: settings?.primary_color ?? '#22C55E',
    secondary_color: settings?.secondary_color ?? '#FFFFFF',
    position: settings?.position ?? 'bottom-right',
    button_size: settings?.button_size ?? 'medium',
    border_radius: settings?.border_radius ?? 16,
    greeting_title: settings?.greeting_title ?? 'Olá! 👋',
    greeting_message: settings?.greeting_message ?? 'Como posso ajudar você hoje?',
    offline_message: settings?.offline_message ?? 'Estamos offline no momento. Deixe sua mensagem e responderemos em breve.',
    input_placeholder: settings?.input_placeholder ?? 'Digite sua mensagem...',
    require_name: settings?.require_name ?? true,
    require_email: settings?.require_email ?? true,
    require_phone: settings?.require_phone ?? false,
    show_agent_photo: settings?.show_agent_photo ?? true,
    show_agent_name: settings?.show_agent_name ?? true,
    play_sound: settings?.play_sound ?? true,
    show_branding: settings?.show_branding ?? true,
    business_hours_only: settings?.business_hours_only ?? false,
  });

  const handleSave = async () => {
    if (hasSettings) {
      await updateSettings.mutateAsync(formData);
    } else {
      await createSettings.mutateAsync(formData);
    }
  };

  const handleCopyCode = async () => {
    const code = generateEmbedCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Widget de Chat</h2>
          <p className="text-muted-foreground">
            Configure o widget de chat para seu site
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.enabled}
            onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
          />
          <Label>Widget ativo</Label>
        </div>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="form" className="gap-2">
            <Settings className="h-4 w-4" />
            Formulário
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            Horário
          </TabsTrigger>
          <TabsTrigger value="install" className="gap-2">
            <Code className="h-4 w-4" />
            Instalação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cores</CardTitle>
              <CardDescription>Personalize as cores do widget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#22C55E"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout</CardTitle>
              <CardDescription>Configure a posição e tamanho do botão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posição</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Inferior direito</SelectItem>
                      <SelectItem value="bottom-left">Inferior esquerdo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tamanho do botão</Label>
                  <Select
                    value={formData.button_size}
                    onValueChange={(value) => setFormData({ ...formData, button_size: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Arredondamento ({formData.border_radius}px)</Label>
                <Slider
                  value={[formData.border_radius]}
                  onValueChange={([value]) => setFormData({ ...formData, border_radius: value })}
                  min={0}
                  max={24}
                  step={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comportamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar foto do agente</Label>
                  <p className="text-sm text-muted-foreground">Exibir avatar do atendente</p>
                </div>
                <Switch
                  checked={formData.show_agent_photo}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_agent_photo: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar nome do agente</Label>
                  <p className="text-sm text-muted-foreground">Exibir nome do atendente</p>
                </div>
                <Switch
                  checked={formData.show_agent_name}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_agent_name: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Som de notificação</Label>
                  <p className="text-sm text-muted-foreground">Tocar som ao receber mensagem</p>
                </div>
                <Switch
                  checked={formData.play_sound}
                  onCheckedChange={(checked) => setFormData({ ...formData, play_sound: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar branding</Label>
                  <p className="text-sm text-muted-foreground">"Powered by MelonChat"</p>
                </div>
                <Switch
                  checked={formData.show_branding}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_branding: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens de boas-vindas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.greeting_title}
                  onChange={(e) => setFormData({ ...formData, greeting_title: e.target.value })}
                  placeholder="Olá! 👋"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem inicial</Label>
                <Textarea
                  value={formData.greeting_message}
                  onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                  placeholder="Como posso ajudar você hoje?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensagem offline</CardTitle>
              <CardDescription>Exibida fora do horário comercial</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.offline_message}
                onChange={(e) => setFormData({ ...formData, offline_message: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Placeholder do input</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.input_placeholder}
                onChange={(e) => setFormData({ ...formData, input_placeholder: e.target.value })}
                placeholder="Digite sua mensagem..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Formulário pré-chat</CardTitle>
              <CardDescription>
                Campos coletados antes de iniciar a conversa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm text-muted-foreground">Solicitar nome do visitante</p>
                </div>
                <Switch
                  checked={formData.require_name}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_name: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">Solicitar email do visitante</p>
                </div>
                <Switch
                  checked={formData.require_email}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_email: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm text-muted-foreground">Solicitar telefone do visitante</p>
                </div>
                <Switch
                  checked={formData.require_phone}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_phone: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horário comercial</CardTitle>
              <CardDescription>
                Limitar widget ao horário de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Apenas em horário comercial</Label>
                  <p className="text-sm text-muted-foreground">
                    Widget só aparece durante o expediente
                  </p>
                </div>
                <Switch
                  checked={formData.business_hours_only}
                  onCheckedChange={(checked) => setFormData({ ...formData, business_hours_only: checked })}
                />
              </div>

              {formData.business_hours_only && (
                <div className="text-sm text-muted-foreground border rounded-lg p-4 bg-muted/50">
                  O horário comercial segue as configurações gerais da empresa
                  em Configurações → Geral.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="install" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Código de instalação</CardTitle>
              <CardDescription>
                Copie e cole este código antes da tag {`</body>`} do seu site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{generateEmbedCode()}</code>
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <span>O widget carrega de forma assíncrona e não afeta a performance do site</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Domínios permitidos</CardTitle>
              <CardDescription>
                Deixe vazio para permitir em qualquer domínio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="exemplo.com.br&#10;app.exemplo.com.br"
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={createSettings.isPending || updateSettings.isPending}
        >
          {(createSettings.isPending || updateSettings.isPending) && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Salvar
        </Button>
      </div>
    </div>
  );
};
