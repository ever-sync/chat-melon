import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Webhook,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';

interface WebhookConfig {
  id: string;
  company_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  failure_count: number;
}

const AVAILABLE_EVENTS = [
  {
    value: 'message.received',
    label: 'Mensagem Recebida',
    description: 'Nova mensagem de cliente',
  },
  {
    value: 'message.sent',
    label: 'Mensagem Enviada',
    description: 'Mensagem enviada pelo atendente',
  },
  {
    value: 'conversation.created',
    label: 'Conversa Criada',
    description: 'Nova conversa iniciada',
  },
  {
    value: 'conversation.closed',
    label: 'Conversa Fechada',
    description: 'Conversa foi encerrada',
  },
  { value: 'contact.created', label: 'Contato Criado', description: 'Novo contato cadastrado' },
  {
    value: 'contact.updated',
    label: 'Contato Atualizado',
    description: 'Dados do contato alterados',
  },
  { value: 'deal.created', label: 'Negócio Criado', description: 'Novo negócio no pipeline' },
  { value: 'deal.updated', label: 'Negócio Atualizado', description: 'Negócio movido/alterado' },
  { value: 'deal.won', label: 'Negócio Ganho', description: 'Negócio marcado como ganho' },
  { value: 'deal.lost', label: 'Negócio Perdido', description: 'Negócio marcado como perdido' },
  {
    value: 'proposal.viewed',
    label: 'Proposta Visualizada',
    description: 'Cliente viu a proposta',
  },
  { value: 'proposal.accepted', label: 'Proposta Aceita', description: 'Cliente aprovou proposta' },
  {
    value: 'proposal.rejected',
    label: 'Proposta Rejeitada',
    description: 'Cliente solicitou ajustes',
  },
];

const WebhooksSettings = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await (supabase as any)
        .from('webhooks')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WebhookConfig[];
    },
    enabled: !!companyId,
  });

  const createWebhook = useMutation({
    mutationFn: async (data: { name: string; url: string; events: string[] }) => {
      const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
      const { error } = await (supabase as any).from('webhooks').insert({
        company_id: companyId,
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook criado com sucesso!');
      setShowCreateModal(false);
      setFormData({ name: '', url: '', events: [] });
    },
    onError: () => toast.error('Erro ao criar webhook'),
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from('webhooks').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook atualizado!');
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook removido!');
    },
  });

  const testWebhook = async (webhook: WebhookConfig) => {
    try {
      toast.info('Enviando teste...');
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret,
        },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { message: 'Este é um teste do webhook!' },
        }),
      });

      if (response.ok) {
        toast.success('Webhook respondeu com sucesso!');
      } else {
        toast.error(`Webhook retornou: ${response.status}`);
      }
    } catch (error) {
      toast.error('Falha ao conectar com o webhook');
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copiado!');
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">
              Receba notificações em tempo real quando eventos acontecerem
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Webhook
          </Button>
        </div>

        <div className="grid gap-4">
          {webhooks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum webhook configurado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Configure webhooks para integrar com sistemas externos
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Webhook className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{webhook.name}</CardTitle>
                        <code className="text-xs text-muted-foreground">{webhook.url}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {webhook.failure_count > 0 && (
                        <Badge variant="destructive">{webhook.failure_count} falhas</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Eventos</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Secret</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-muted p-2 rounded text-xs">
                        {showSecret[webhook.id] ? webhook.secret : '•'.repeat(32)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setShowSecret((prev) => ({ ...prev, [webhook.id]: !prev[webhook.id] }))
                        }
                      >
                        {showSecret[webhook.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copySecret(webhook.secret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={(checked) =>
                          toggleWebhook.mutate({ id: webhook.id, is_active: checked })
                        }
                      />
                      <span className="text-sm">{webhook.is_active ? 'Ativo' : 'Desativado'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => testWebhook(webhook)}>
                        <Send className="h-4 w-4 mr-2" />
                        Testar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Remover este webhook?')) {
                            deleteWebhook.mutate(webhook.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Integração ERP"
                />
              </div>
              <div>
                <Label>URL do Endpoint</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://seu-servidor.com/webhook"
                />
              </div>
              <div>
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div
                      key={event.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.events.includes(event.value)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleEvent(event.value)}
                    >
                      <div className="font-medium text-sm">{event.label}</div>
                      <div className="text-xs text-muted-foreground">{event.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createWebhook.mutate(formData)}
                disabled={!formData.name || !formData.url || formData.events.length === 0}
              >
                Criar Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default WebhooksSettings;
