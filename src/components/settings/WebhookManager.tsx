import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Webhook,
  Plus,
  MoreHorizontal,
  Trash2,
  Play,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useWebhooks, WEBHOOK_EVENTS, type WebhookEndpoint } from '@/hooks/useWebhooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const WebhookManager = () => {
  const {
    webhooks,
    isLoading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    regenerateSecret,
  } = useWebhooks();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleCreate = async () => {
    await createWebhook.mutateAsync({
      name,
      url,
      events: selectedEvents,
    });

    setShowCreateDialog(false);
    setName('');
    setUrl('');
    setSelectedEvents([]);
  };

  const handleDelete = async () => {
    if (!selectedWebhookId) return;
    await deleteWebhook.mutateAsync(selectedWebhookId);
    setShowDeleteDialog(false);
    setSelectedWebhookId(null);
  };

  const handleTest = async (id: string) => {
    await testWebhook.mutateAsync(id);
  };

  const handleToggleEnabled = async (webhook: WebhookEndpoint) => {
    await updateWebhook.mutateAsync({
      id: webhook.id,
      updates: { enabled: !webhook.enabled },
    });
  };

  const handleCopySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    toast.success('Secret copiado!');
  };

  const toggleShowSecret = (id: string) => {
    setShowSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const selectAllEvents = () => {
    setSelectedEvents(WEBHOOK_EVENTS.map((e) => e.value));
  };

  const clearAllEvents = () => {
    setSelectedEvents([]);
  };

  // Group events by category
  const eventsByCategory = WEBHOOK_EVENTS.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof WEBHOOK_EVENTS[number][]>);

  const getStatusBadge = (webhook: WebhookEndpoint) => {
    if (webhook.disabled_at) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Desabilitado
        </Badge>
      );
    }
    if (!webhook.enabled) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pausado
        </Badge>
      );
    }
    if (webhook.consecutive_failures > 0) {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
          <AlertTriangle className="h-3 w-3" />
          {webhook.consecutive_failures} falhas
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 border-green-500 text-green-500">
        <CheckCircle className="h-3 w-3" />
        Ativo
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-muted-foreground">
            Configure endpoints para receber eventos em tempo real
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Criar Webhook</DialogTitle>
              <DialogDescription>
                Configure um endpoint para receber eventos
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Integração CRM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL do Endpoint</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://seu-servidor.com/webhook"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Eventos</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllEvents}
                    >
                      Selecionar todos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllEvents}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>

                <Accordion type="multiple" className="border rounded-lg">
                  {Object.entries(eventsByCategory).map(([category, events]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span>{category}</span>
                          <Badge variant="secondary" className="text-xs">
                            {events.filter((e) => selectedEvents.includes(e.value)).length}/{events.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {events.map((event) => (
                            <div key={event.value} className="flex items-center gap-2">
                              <Checkbox
                                id={event.value}
                                checked={selectedEvents.includes(event.value)}
                                onCheckedChange={() => toggleEvent(event.value)}
                              />
                              <label
                                htmlFor={event.value}
                                className="text-sm cursor-pointer"
                              >
                                {event.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name || !url || selectedEvents.length === 0 || createWebhook.isPending}
              >
                {createWebhook.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O endpoint deixará de receber eventos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Webhooks List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum webhook configurado</p>
            <p className="text-sm text-muted-foreground">
              Crie um webhook para receber eventos em tempo real
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={webhook.enabled && !webhook.disabled_at}
                      onCheckedChange={() => handleToggleEnabled(webhook)}
                      disabled={!!webhook.disabled_at}
                    />
                    <div>
                      <CardTitle className="text-base">{webhook.name}</CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        {webhook.url}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(webhook)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleTest(webhook.id)}
                          disabled={testWebhook.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Testar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => regenerateSecret.mutate(webhook.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerar Secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedWebhookId(webhook.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Secret:</Label>
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                    {showSecrets.has(webhook.id)
                      ? webhook.secret
                      : '•'.repeat(32)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleShowSecret(webhook.id)}
                  >
                    {showSecrets.has(webhook.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopySecret(webhook.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Eventos:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    <strong>{webhook.total_deliveries}</strong> entregas
                  </span>
                  <span>
                    <strong>{webhook.successful_deliveries}</strong> sucesso
                  </span>
                  {webhook.last_triggered_at && (
                    <span>
                      Último:{' '}
                      {formatDistanceToNow(new Date(webhook.last_triggered_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  )}
                  {webhook.avg_response_time_ms && (
                    <span>
                      Média: {webhook.avg_response_time_ms}ms
                    </span>
                  )}
                </div>

                {webhook.last_failure_reason && (
                  <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    Último erro: {webhook.last_failure_reason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Webhook Signature Info */}
      <Card>
        <CardHeader>
          <CardTitle>Verificação de Assinatura</CardTitle>
          <CardDescription>
            Valide as requisições usando a assinatura HMAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Exemplo em Node.js
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from('sha256=' + expectedSignature)
  );
}

// O header X-MelonChat-Signature contém a assinatura`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
