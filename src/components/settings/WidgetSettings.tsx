import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Trash2,
  Plus,
  ArrowRight,
  Shield,
  Smartphone,
  Layout,
  Type,
  Image as ImageIcon,
} from 'lucide-react';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { useAllCustomFields } from '@/hooks/useAllCustomFields';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const WidgetSettings = () => {
  const { settings, isLoading, createSettings, updateSettings, generateEmbedCode, hasSettings } =
    useWidgetSettings();
  const { contactFields } = useAllCustomFields();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');

  const [formData, setFormData] = useState<any>({
    enabled: true,
    primary_color: '#22C55E',
    secondary_color: '#FFFFFF',
    header_gradient: 'linear-gradient(135deg, #22C55E 0%, #15803d 100%)',
    bubble_gradient: 'linear-gradient(135deg, #22C55E 0%, #15803d 100%)',
    shadow_intensity: 'medium',
    font_family: 'Inter',
    position: 'bottom-right',
    button_size: 'medium',
    border_radius: 16,
    greeting_title: 'Olá! 👋',
    greeting_message: 'Como posso ajudar você hoje?',
    offline_message: 'Estamos offline no momento. Deixe sua mensagem e responderemos em breve.',
    input_placeholder: 'Digite sua mensagem...',
    require_name: true,
    require_email: true,
    require_phone: false,
    show_agent_photo: true,
    show_agent_name: true,
    play_sound: true,
    show_branding: true,
    business_hours_only: false,
    custom_fields: [],
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ...formData,
        ...settings,
        custom_fields: settings.custom_fields || [],
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      if (hasSettings) {
        await updateSettings.mutateAsync(formData);
      } else {
        await createSettings.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleCopyCode = async () => {
    const code = generateEmbedCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const addCustomField = (fieldId: string) => {
    const field = contactFields.find((f) => f.id === fieldId);
    if (!field) return;

    if (formData.custom_fields.find((cf: any) => cf.id === fieldId)) {
      toast.error('Este campo já foi adicionado');
      return;
    }

    setFormData({
      ...formData,
      custom_fields: [
        ...formData.custom_fields,
        {
          id: field.id,
          label: field.field_label,
          name: field.field_name,
          required: false,
          type: 'text',
        },
      ],
    });
  };

  const removeCustomField = (fieldId: string) => {
    setFormData({
      ...formData,
      custom_fields: formData.custom_fields.filter((f: any) => f.id !== fieldId),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const shadowClasses = {
    none: 'shadow-none',
    low: 'shadow-sm',
    medium: 'shadow-lg',
    high: 'shadow-2xl',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Settings */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Widget de Chat</h2>
            <p className="text-muted-foreground">O melhor widget do mercado para o seu site</p>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg px-4 border">
            <Switch
              checked={formData.enabled}
              onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
            />
            <Label className="font-semibold">{formData.enabled ? 'Ativo' : 'Inativo'}</Label>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-12 bg-muted/30 p-1 mb-6">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-background px-4">
              <Palette className="h-4 w-4 mr-2" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-background px-4">
              <MessageCircle className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="form" className="data-[state=active]:bg-background px-4">
              <Settings className="h-4 w-4 mr-2" />
              Formulário
            </TabsTrigger>
            <TabsTrigger value="install" className="data-[state=active]:bg-background px-4">
              <Code className="h-4 w-4 mr-2" />
              Instalação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="overflow-hidden border-none shadow-md">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-4 w-4 text-primary" />
                  Personalização Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Cor Principal</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-inner cursor-pointer" 
                        style={{ backgroundColor: formData.primary_color }}
                        onClick={() => document.getElementById('primary-color-input')?.click()}
                      />
                      <Input
                        id="primary-color-input"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="hidden"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded-lg border shadow-inner cursor-pointer" 
                        style={{ backgroundColor: formData.secondary_color }}
                        onClick={() => document.getElementById('secondary-color-input')?.click()}
                      />
                      <Input
                        id="secondary-color-input"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="hidden"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Gradient do Cabeçalho (CSS)</Label>
                  <Input 
                    value={formData.header_gradient}
                    onChange={(e) => setFormData({ ...formData, header_gradient: e.target.value })}
                    placeholder="linear-gradient(...)"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Tipografia</Label>
                    <Select
                      value={formData.font_family}
                      onValueChange={(v) => setFormData({ ...formData, font_family: v })}
                    >
                      <SelectTrigger>
                        <Type className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="System UI">System UI</SelectItem>
                        <SelectItem value="Outfit">Outfit</SelectItem>
                        <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Sombra</Label>
                    <Select
                      value={formData.shadow_intensity}
                      onValueChange={(v) => setFormData({ ...formData, shadow_intensity: v })}
                    >
                      <SelectTrigger>
                        <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="low">Suave</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Intensa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Layout & Botão
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Posição</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(v) => setFormData({ ...formData, position: v as any })}
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
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Tamanho</Label>
                    <Select
                      value={formData.button_size}
                      onValueChange={(v) => setFormData({ ...formData, button_size: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Discreto</SelectItem>
                        <SelectItem value="medium">Padrão</SelectItem>
                        <SelectItem value="large">Destaque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Arredondamento</Label>
                    <Badge variant="secondary">{formData.border_radius}px</Badge>
                  </div>
                  <Slider
                    value={[formData.border_radius]}
                    onValueChange={([v]) => setFormData({ ...formData, border_radius: v })}
                    min={0}
                    max={24}
                    step={2}
                    className="py-4"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Textos & Boas-vindas</CardTitle>
                <CardDescription>Defina como você quer falar com seus clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título de Saudação</Label>
                  <Input
                    value={formData.greeting_title}
                    onChange={(e) => setFormData({ ...formData, greeting_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem de Convite</Label>
                  <Textarea
                    value={formData.greeting_message}
                    onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Placeholder da Caixa de Texto</Label>
                  <Input
                    value={formData.input_placeholder}
                    onChange={(e) => setFormData({ ...formData, input_placeholder: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Estado Offline</CardTitle>
                <CardDescription>Mensagem exibida fora do horário de atendimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="space-y-0.5">
                    <Label>Respeitar Horário Comercial</Label>
                    <p className="text-xs text-muted-foreground">Configurado em Geral {'->'} Horários</p>
                  </div>
                  <Switch
                    checked={formData.business_hours_only}
                    onCheckedChange={(v) => setFormData({ ...formData, business_hours_only: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem Offline</Label>
                  <Textarea
                    value={formData.offline_message}
                    onChange={(e) => setFormData({ ...formData, offline_message: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Campos Padrão</CardTitle>
                <CardDescription>Informações básicas para capturar o contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b">
                  <Label className="cursor-pointer" htmlFor="req-name">Nome do Visitante</Label>
                  <Switch
                    id="req-name"
                    checked={formData.require_name}
                    onCheckedChange={(v) => setFormData({ ...formData, require_name: v })}
                  />
                </div>
                <div className="flex items-center justify-between py-4 border-b">
                  <Label className="cursor-pointer" htmlFor="req-email">E-mail</Label>
                  <Switch
                    id="req-email"
                    checked={formData.require_email}
                    onCheckedChange={(v) => setFormData({ ...formData, require_email: v })}
                  />
                </div>
                <div className="flex items-center justify-between py-4">
                  <Label className="cursor-pointer" htmlFor="req-phone">Telefone / WhatsApp</Label>
                  <Switch
                    id="req-phone"
                    checked={formData.require_phone}
                    onCheckedChange={(v) => setFormData({ ...formData, require_phone: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Campos Personalizados (CRM)
                </CardTitle>
                <CardDescription>
                  Adicione campos que você já usa no seu CRM para capturar dados mais específicos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Select onValueChange={(v) => addCustomField(v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Escolher campo do CRM..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contactFields.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.field_label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.custom_fields.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
                      Nenhum campo personalizado adicionado
                    </div>
                  ) : (
                    formData.custom_fields.map((field: any) => (
                      <div key={field.id} className="flex items-center justify-between p-4 bg-background border rounded-xl shadow-sm animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{field.label}</p>
                            <p className="text-xs text-muted-foreground">{field.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-2 mr-4">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Obrigatório</Label>
                              <Switch 
                                checked={field.required}
                                onCheckedChange={(v) => {
                                  const newFields = formData.custom_fields.map((f: any) => 
                                    f.id === field.id ? { ...f, required: v } : f
                                  );
                                  setFormData({ ...formData, custom_fields: newFields });
                                }}
                              />
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => removeCustomField(field.id)}
                             className="text-destructive hover:bg-destructive/10"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="install" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Script de Ativação
                </CardTitle>
                <CardDescription>
                  Basta copiar este código e colar antes do fechamento da tag {`</body>`} no seu site.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative group">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyCode}
                      className="shadow-xl"
                    >
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? 'Copiado!' : 'Copiar Script'}
                    </Button>
                  </div>
                  <pre className="p-6 bg-slate-950 text-slate-50 rounded-2xl text-xs font-mono overflow-auto border-4 border-slate-900 shadow-2xl">
                    <code>{generateEmbedCode()}</code>
                  </pre>
                </div>

                <div className="mt-8 flex items-center gap-4 p-4 bg-muted/40 rounded-xl border border-dashed">
                  <div className="p-3 bg-white rounded-full shadow-sm text-primary">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">Pronto para SEO e Performance</p>
                    <p className="text-xs text-muted-foreground">O script carrega de forma assíncrona, garantindo nota máxima no Google PageSpeed.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="rounded-xl px-8"
          >
            Descartar
          </Button>
          <Button
            onClick={handleSave}
            disabled={createSettings.isPending || updateSettings.isPending}
            className="rounded-xl px-12 shadow-md shadow-primary/20 transition-all hover:scale-105"
          >
            {(createSettings.isPending || updateSettings.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* Right Column: Live Preview */}
      <div className="lg:col-span-5 relative hidden lg:block">
        <div className="sticky top-6">
           <div className="bg-slate-100 rounded-[32px] p-6 border-8 border-slate-200 shadow-xl overflow-hidden min-h-[700px] flex flex-col items-center justify-center">
              <div className="text-center space-y-2 mb-12">
                 <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">Site do seu Cliente</Badge>
                 <h3 className="text-xl font-bold text-slate-800">Preview ao Vivo</h3>
                 <p className="text-sm text-slate-500">Veja exatamente como seu widget aparecerá</p>
              </div>

              {/* Fake Website Content */}
              <div className="w-full space-y-4 opacity-20">
                 <div className="h-8 bg-slate-300 rounded w-1/3" />
                 <div className="h-32 bg-slate-300 rounded w-full" />
                 <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-300 rounded" />
                    <div className="h-24 bg-slate-300 rounded" />
                 </div>
              </div>

              {/* The Widget Preview */}
              <div 
                className={cn(
                  "absolute transition-all duration-500 ease-in-out flex flex-col items-end",
                  formData.position === 'bottom-right' ? "bottom-12 right-12" : "bottom-12 left-12 items-start"
                )}
                style={{ fontFamily: formData.font_family }}
              >
                {/* Widget Window */}
                <div className={cn(
                  "w-[340px] bg-white rounded-[24px] overflow-hidden flex flex-col mb-4 animate-in slide-in-from-bottom-4 duration-300 origin-bottom-right",
                  shadowClasses[formData.shadow_intensity as keyof typeof shadowClasses || 'medium']
                )}>
                   {/* Header */}
                   <div 
                     className="p-6 text-white"
                     style={{ background: formData.header_gradient || formData.primary_color }}
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 backdrop-blur-sm overflow-hidden">
                           {formData.logo_url ? (
                             <img src={formData.logo_url} className="w-full h-full object-cover" />
                           ) : (
                             <ImageIcon className="h-6 w-6 text-white" />
                           )}
                        </div>
                        <div>
                           <h4 className="font-bold text-lg leading-tight">{formData.company_name || 'Atendimento'}</h4>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-xs opacity-90">Em linha agora</span>
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* Content */}
                   <div className="flex-1 p-6 space-y-5 bg-slate-50/50">
                      <div className="space-y-1">
                         <h5 className="font-bold text-slate-800 text-lg">{formData.greeting_title}</h5>
                         <p className="text-slate-500 text-sm leading-relaxed">{formData.greeting_message}</p>
                      </div>

                      <div className="space-y-3">
                         {formData.require_name && (
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-slate-400">Nome completo</Label>
                              <div className="h-10 bg-white border border-slate-200 rounded-lg" />
                           </div>
                         )}
                         {formData.require_email && (
                           <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-slate-400">E-mail corporativo</Label>
                              <div className="h-10 bg-white border border-slate-200 rounded-lg" />
                           </div>
                         )}
                         {formData.custom_fields.map((f: any) => (
                           <div key={f.id} className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-slate-400">{f.label}</Label>
                              <div className="h-10 bg-white border border-slate-200 rounded-lg" />
                           </div>
                         ))}
                      </div>

                      <Button 
                        className="w-full h-12 hover:scale-[1.02] transition-transform shadow-lg"
                        style={{ 
                          background: formData.primary_color,
                          borderRadius: `${formData.border_radius}px`,
                          boxShadow: `0 8px 16px ${formData.primary_color}40`
                        }}
                      >
                        Começar Atendimento
                      </Button>
                   </div>
                   
                   {formData.show_branding && (
                     <div className="p-3 bg-white border-t text-center text-[10px] text-slate-300 uppercase tracking-widest">
                       Powered by <span className="font-bold text-slate-400">MelonChat</span>
                     </div>
                   )}
                </div>

                {/* Bubble */}
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110 cursor-pointer shadow-2xl",
                    formData.button_size === 'small' ? "w-12 h-12" : formData.button_size === 'large' ? "w-20 h-20" : "w-16 h-16"
                  )}
                  style={{ 
                    background: formData.bubble_gradient || formData.primary_color,
                    boxShadow: `0 12px 24px ${formData.primary_color}50`
                  }}
                >
                   <MessageCircle className={cn(
                     "transition-all",
                     formData.button_size === 'small' ? "h-6 w-6" : formData.button_size === 'large' ? "h-10 w-10" : "h-8 w-8"
                   )} />
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
