import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Settings2,
  Bell,
  Mail,
  Clock,
  Eye,
  EyeOff,
  Zap,
  Trophy,
  XCircle,
  Calendar,
  Users,
  MessageSquare,
  Target,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string | null;
  pipelineName?: string;
}

interface PipelineConfig {
  // Automações de Fechamento
  auto_archive_won_days: number | null;
  auto_archive_lost_days: number | null;
  hide_archived_deals: boolean;

  // Notificações
  notify_deal_won: boolean;
  notify_deal_lost: boolean;
  notify_deal_stale: boolean;
  stale_days_threshold: number;
  notify_high_value_deal: boolean;
  high_value_threshold: number;

  // Email
  send_email_deal_won: boolean;
  send_email_deal_lost: boolean;
  email_recipients: string;

  // Automações
  auto_assign_round_robin: boolean;
  auto_create_task_on_stage_change: boolean;
  default_task_template: string;

  // Integrações
  webhook_url: string;
  webhook_events: string[];

  // Visualização
  show_deal_age: boolean;
  show_probability: boolean;
  show_expected_close_date: boolean;
  default_view: 'kanban' | 'list' | 'calendar';
}

const defaultConfig: PipelineConfig = {
  auto_archive_won_days: 30,
  auto_archive_lost_days: 15,
  hide_archived_deals: true,
  notify_deal_won: true,
  notify_deal_lost: true,
  notify_deal_stale: true,
  stale_days_threshold: 7,
  notify_high_value_deal: true,
  high_value_threshold: 10000,
  send_email_deal_won: false,
  send_email_deal_lost: false,
  email_recipients: '',
  auto_assign_round_robin: false,
  auto_create_task_on_stage_change: false,
  default_task_template: '',
  webhook_url: '',
  webhook_events: [],
  show_deal_age: true,
  show_probability: true,
  show_expected_close_date: true,
  default_view: 'kanban',
};

export function PipelineConfigModal({
  open,
  onOpenChange,
  pipelineId,
  pipelineName,
}: PipelineConfigModalProps) {
  const [config, setConfig] = useState<PipelineConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pipelineId && open) {
      loadConfig();
    }
  }, [pipelineId, open]);

  const loadConfig = async () => {
    if (!pipelineId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('settings')
        .eq('id', pipelineId)
        .single();

      if (error) throw error;

      if (data?.settings) {
        setConfig({ ...defaultConfig, ...(data.settings as Partial<PipelineConfig>) });
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error loading pipeline config:', error);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pipelineId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('pipelines')
        .update({ settings: config as any })
        .eq('id', pipelineId);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving pipeline config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof PipelineConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border-none shadow-2xl p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Settings2 className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <DialogTitle className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Settings2 className="h-7 w-7" />
              </div>
              Configurações do Pipeline
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-lg">
              {pipelineName || 'Pipeline'} - Personalize automações, notificações e comportamentos
            </DialogDescription>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          <Tabs defaultValue="automation" className="w-full">
            <div className="sticky top-0 bg-white z-10 border-b px-6 pt-4">
              <TabsList className="grid grid-cols-5 gap-2 bg-gray-100/80 p-1 rounded-2xl">
                <TabsTrigger value="automation" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Automações
                </TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                </TabsTrigger>
                <TabsTrigger value="email" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="display" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Exibição
                </TabsTrigger>
                <TabsTrigger value="integrations" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Integrações
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 space-y-6">
              {/* Tab Automações */}
              <TabsContent value="automation" className="space-y-6 mt-0">
                {/* Arquivamento Automático */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                      <Trophy className="h-5 w-5" />
                      Negócios Ganhos
                    </CardTitle>
                    <CardDescription>
                      Configure o que acontece com negócios marcados como ganhos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Ocultar automaticamente após</Label>
                        <p className="text-sm text-muted-foreground">
                          Negócios ganhos serão ocultados do kanban após este período
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.auto_archive_won_days || ''}
                          onChange={(e) => updateConfig('auto_archive_won_days', parseInt(e.target.value) || null)}
                          className="w-20 rounded-xl"
                          placeholder="30"
                        />
                        <span className="text-sm text-muted-foreground">dias</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
                    <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      Negócios Perdidos
                    </CardTitle>
                    <CardDescription>
                      Configure o que acontece com negócios marcados como perdidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Ocultar automaticamente após</Label>
                        <p className="text-sm text-muted-foreground">
                          Negócios perdidos serão ocultados do kanban após este período
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.auto_archive_lost_days || ''}
                          onChange={(e) => updateConfig('auto_archive_lost_days', parseInt(e.target.value) || null)}
                          className="w-20 rounded-xl"
                          placeholder="15"
                        />
                        <span className="text-sm text-muted-foreground">dias</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                      <Users className="h-5 w-5" />
                      Distribuição de Leads
                    </CardTitle>
                    <CardDescription>
                      Automatize a atribuição de novos negócios
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Distribuição Round Robin</Label>
                        <p className="text-sm text-muted-foreground">
                          Novos negócios são distribuídos automaticamente entre os vendedores
                        </p>
                      </div>
                      <Switch
                        checked={config.auto_assign_round_robin}
                        onCheckedChange={(checked) => updateConfig('auto_assign_round_robin', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Criar tarefa ao mudar de etapa</Label>
                        <p className="text-sm text-muted-foreground">
                          Uma tarefa de follow-up é criada automaticamente
                        </p>
                      </div>
                      <Switch
                        checked={config.auto_create_task_on_stage_change}
                        onCheckedChange={(checked) => updateConfig('auto_create_task_on_stage_change', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Notificações */}
              <TabsContent value="notifications" className="space-y-6 mt-0">
                <Card className="border-none shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5 text-indigo-500" />
                      Alertas do Sistema
                    </CardTitle>
                    <CardDescription>
                      Configure quando você deseja receber notificações
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <div>
                          <Label className="font-semibold text-green-700">Negócio Ganho</Label>
                          <p className="text-sm text-green-600">Notificar quando um negócio for fechado como ganho</p>
                        </div>
                      </div>
                      <Switch
                        checked={config.notify_deal_won}
                        onCheckedChange={(checked) => updateConfig('notify_deal_won', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <Label className="font-semibold text-red-700">Negócio Perdido</Label>
                          <p className="text-sm text-red-600">Notificar quando um negócio for marcado como perdido</p>
                        </div>
                      </div>
                      <Switch
                        checked={config.notify_deal_lost}
                        onCheckedChange={(checked) => updateConfig('notify_deal_lost', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div>
                          <Label className="font-semibold text-amber-700">Negócio Parado</Label>
                          <p className="text-sm text-amber-600">Alertar sobre negócios sem movimentação</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={config.stale_days_threshold}
                          onChange={(e) => updateConfig('stale_days_threshold', parseInt(e.target.value))}
                          className="w-16 rounded-xl"
                          disabled={!config.notify_deal_stale}
                        />
                        <span className="text-sm text-muted-foreground">dias</span>
                        <Switch
                          checked={config.notify_deal_stale}
                          onCheckedChange={(checked) => updateConfig('notify_deal_stale', checked)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <div>
                          <Label className="font-semibold text-purple-700">Negócio de Alto Valor</Label>
                          <p className="text-sm text-purple-600">Alertar sobre negócios acima de um valor</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          value={config.high_value_threshold}
                          onChange={(e) => updateConfig('high_value_threshold', parseInt(e.target.value))}
                          className="w-24 rounded-xl"
                          disabled={!config.notify_high_value_deal}
                        />
                        <Switch
                          checked={config.notify_high_value_deal}
                          onCheckedChange={(checked) => updateConfig('notify_high_value_deal', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Email */}
              <TabsContent value="email" className="space-y-6 mt-0">
                <Card className="border-none shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-indigo-500" />
                      Notificações por Email
                    </CardTitle>
                    <CardDescription>
                      Envie emails automáticos para eventos importantes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Email ao ganhar negócio</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar email de celebração quando um negócio for ganho
                        </p>
                      </div>
                      <Switch
                        checked={config.send_email_deal_won}
                        onCheckedChange={(checked) => updateConfig('send_email_deal_won', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Email ao perder negócio</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar relatório quando um negócio for perdido
                        </p>
                      </div>
                      <Switch
                        checked={config.send_email_deal_lost}
                        onCheckedChange={(checked) => updateConfig('send_email_deal_lost', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Destinatários</Label>
                      <Textarea
                        value={config.email_recipients}
                        onChange={(e) => updateConfig('email_recipients', e.target.value)}
                        placeholder="email1@empresa.com, email2@empresa.com"
                        className="rounded-xl"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separe múltiplos emails por vírgula
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Exibição */}
              <TabsContent value="display" className="space-y-6 mt-0">
                <Card className="border-none shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-indigo-500" />
                      Configurações de Exibição
                    </CardTitle>
                    <CardDescription>
                      Personalize como os negócios são exibidos no pipeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-semibold">Visualização Padrão</Label>
                      <Select
                        value={config.default_view}
                        onValueChange={(value) => updateConfig('default_view', value)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kanban">Kanban (Colunas)</SelectItem>
                          <SelectItem value="list">Lista</SelectItem>
                          <SelectItem value="calendar">Agenda/Calendário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Mostrar idade do negócio</Label>
                        <p className="text-sm text-muted-foreground">
                          Exibir há quantos dias o negócio está no pipeline
                        </p>
                      </div>
                      <Switch
                        checked={config.show_deal_age}
                        onCheckedChange={(checked) => updateConfig('show_deal_age', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Mostrar probabilidade</Label>
                        <p className="text-sm text-muted-foreground">
                          Exibir a probabilidade de fechamento nos cards
                        </p>
                      </div>
                      <Switch
                        checked={config.show_probability}
                        onCheckedChange={(checked) => updateConfig('show_probability', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Mostrar data de fechamento esperada</Label>
                        <p className="text-sm text-muted-foreground">
                          Exibir previsão de fechamento nos cards
                        </p>
                      </div>
                      <Switch
                        checked={config.show_expected_close_date}
                        onCheckedChange={(checked) => updateConfig('show_expected_close_date', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-semibold">Ocultar negócios arquivados</Label>
                        <p className="text-sm text-muted-foreground">
                          Não exibir negócios ganhos/perdidos antigos no kanban
                        </p>
                      </div>
                      <Switch
                        checked={config.hide_archived_deals}
                        onCheckedChange={(checked) => updateConfig('hide_archived_deals', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Integrações */}
              <TabsContent value="integrations" className="space-y-6 mt-0">
                <Card className="border-none shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-indigo-500" />
                      Webhooks
                    </CardTitle>
                    <CardDescription>
                      Integre com sistemas externos através de webhooks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-semibold">URL do Webhook</Label>
                      <Input
                        value={config.webhook_url}
                        onChange={(e) => updateConfig('webhook_url', e.target.value)}
                        placeholder="https://sua-api.com/webhook"
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Eventos serão enviados via POST para esta URL
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="font-semibold">Eventos para notificar</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'deal_created', label: 'Negócio criado' },
                          { id: 'deal_updated', label: 'Negócio atualizado' },
                          { id: 'deal_won', label: 'Negócio ganho' },
                          { id: 'deal_lost', label: 'Negócio perdido' },
                          { id: 'stage_changed', label: 'Mudança de etapa' },
                          { id: 'deal_assigned', label: 'Negócio atribuído' },
                        ].map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all",
                              config.webhook_events?.includes(event.id)
                                ? "bg-indigo-50 border-indigo-200"
                                : "bg-gray-50 border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => {
                              const events = config.webhook_events || [];
                              if (events.includes(event.id)) {
                                updateConfig('webhook_events', events.filter((e) => e !== event.id));
                              } else {
                                updateConfig('webhook_events', [...events, event.id]);
                              }
                            }}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded border-2 flex items-center justify-center",
                                config.webhook_events?.includes(event.id)
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-gray-300"
                              )}
                            >
                              {config.webhook_events?.includes(event.id) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm font-medium">{event.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-100 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-800">Dica de Integração</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Use webhooks para integrar com ferramentas como Zapier, Make (Integromat),
                          n8n ou seu próprio sistema. Os eventos são enviados em formato JSON.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t bg-gray-50/50">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl h-12 px-8 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl h-12 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/20 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
