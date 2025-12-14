import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Plug,
  Unplug,
} from 'lucide-react';
import { useChannels, useChannelHealth } from '@/hooks/useChannels';
import { ChannelIcon, getChannelLabel } from '@/components/chat/ChannelIcon';
import type { Channel, ChannelType, ChannelStatus, CHANNEL_INFO } from '@/types/channels';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ChannelsSettings = () => {
  const {
    channels,
    isLoading,
    createChannel,
    deleteChannel,
    connectChannel,
    disconnectChannel,
  } = useChannels();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [configureChannelId, setConfigureChannelId] = useState<string | null>(null);

  const availableChannelTypes: ChannelType[] = ['instagram', 'messenger', 'telegram'];

  // Get channel to delete
  const channelToDelete = channels.find((c) => c.id === deleteChannelId);

  // Get channel to configure
  const channelToConfigure = channels.find((c) => c.id === configureChannelId);

  const handleAddChannel = (type: ChannelType) => {
    setSelectedType(type);
    setShowAddDialog(true);
  };

  const getStatusIcon = (status: ChannelStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
      case 'rate_limited':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: ChannelStatus) => {
    const labels: Record<ChannelStatus, string> = {
      connected: 'Conectado',
      connecting: 'Conectando...',
      disconnected: 'Desconectado',
      error: 'Erro',
      rate_limited: 'Limite excedido',
    };
    return labels[status];
  };

  const getStatusVariant = (status: ChannelStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'connecting':
        return 'secondary';
      case 'error':
      case 'rate_limited':
        return 'destructive';
      default:
        return 'outline';
    }
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
          <h2 className="text-2xl font-bold">Canais de Comunicação</h2>
          <p className="text-muted-foreground">
            Conecte seus canais para receber mensagens em um só lugar
          </p>
        </div>
      </div>

      {/* Connected Channels */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Canais Conectados</h3>

        {channels.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Plug className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum canal conectado ainda.
                <br />
                Adicione um canal abaixo para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onConfigure={() => setConfigureChannelId(channel.id)}
                onConnect={() => connectChannel.mutate(channel.id)}
                onDisconnect={() => disconnectChannel.mutate(channel.id)}
                onDelete={() => setDeleteChannelId(channel.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Available Channels to Add */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Adicionar Novo Canal</h3>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableChannelTypes.map((type) => {
            const existingChannel = channels.find((c) => c.type === type);

            return (
              <Card
                key={type}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  existingChannel && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => !existingChannel && handleAddChannel(type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <ChannelIcon type={type} size="lg" showBackground />
                    <div>
                      <CardTitle className="text-base">{getChannelLabel(type)}</CardTitle>
                      <CardDescription className="text-xs">
                        {existingChannel ? 'Já conectado' : 'Clique para adicionar'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {type === 'instagram' && (
                      <>
                        <li>• Direct Messages</li>
                        <li>• Stories Mentions</li>
                        <li>• Quick Replies</li>
                      </>
                    )}
                    {type === 'messenger' && (
                      <>
                        <li>• Mensagens da Page</li>
                        <li>• Templates estruturados</li>
                        <li>• Persistent Menu</li>
                      </>
                    )}
                    {type === 'telegram' && (
                      <>
                        <li>• Bot Commands</li>
                        <li>• Inline Mode</li>
                        <li>• Grupos</li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add Channel Dialog */}
      <AddChannelDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        channelType={selectedType}
        onSubmit={async (data) => {
          await createChannel.mutateAsync(data);
          setShowAddDialog(false);
          setSelectedType(null);
        }}
        isLoading={createChannel.isPending}
      />

      {/* Configure Channel Dialog */}
      {channelToConfigure && (
        <ConfigureChannelDialog
          open={!!configureChannelId}
          onOpenChange={(open) => !open && setConfigureChannelId(null)}
          channel={channelToConfigure}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteChannelId} onOpenChange={(open) => !open && setDeleteChannelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O canal "{channelToDelete?.name}" será
              desconectado e todas as configurações serão perdidas.
              <br /><br />
              <strong>Nota:</strong> As conversas existentes não serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteChannelId) {
                  deleteChannel.mutate(deleteChannelId);
                  setDeleteChannelId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// =====================================================
// Channel Card Component
// =====================================================

interface ChannelCardProps {
  channel: Channel;
  onConfigure: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}

const ChannelCard = ({
  channel,
  onConfigure,
  onConnect,
  onDisconnect,
  onDelete,
}: ChannelCardProps) => {
  const { metrics } = useChannelHealth(channel.id);

  const getStatusIcon = (status: ChannelStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
      case 'rate_limited':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChannelIcon type={channel.type} size="lg" showBackground />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{channel.name}</h4>
                <Badge
                  variant={channel.status === 'connected' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {getStatusIcon(channel.status)}
                  <span className="ml-1">{channel.status}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {getChannelLabel(channel.type)}
                {channel.external_id && ` • ${channel.external_id}`}
              </p>
              {channel.error_message && (
                <p className="text-xs text-destructive mt-1">
                  {channel.error_message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground mr-4">
              <div className="text-center">
                <div className="font-semibold text-foreground">
                  {channel.total_conversations}
                </div>
                <div className="text-xs">Conversas</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">
                  {channel.total_messages_sent}
                </div>
                <div className="text-xs">Enviadas</div>
              </div>
              {metrics && (
                <div className="text-center">
                  <div className="font-semibold text-foreground">
                    {metrics.uptime}%
                  </div>
                  <div className="text-xs">Uptime</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onConfigure}
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {channel.status === 'connected' ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDisconnect}
                title="Desconectar"
              >
                <Unplug className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onConnect}
                title="Conectar"
              >
                <Plug className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// Add Channel Dialog
// =====================================================

interface AddChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelType: ChannelType | null;
  onSubmit: (data: { type: ChannelType; name: string; credentials: Record<string, unknown> }) => Promise<void>;
  isLoading: boolean;
}

const AddChannelDialog = ({
  open,
  onOpenChange,
  channelType,
  onSubmit,
  isLoading,
}: AddChannelDialogProps) => {
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    if (!channelType || !name) return;

    await onSubmit({
      type: channelType,
      name,
      credentials,
    });

    setName('');
    setCredentials({});
  };

  const renderCredentialsForm = () => {
    if (!channelType) return null;

    switch (channelType) {
      case 'instagram':
      case 'messenger':
        return (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Para conectar o {getChannelLabel(channelType)}, você precisa autorizar
              o acesso através do Facebook.
            </p>
            <Button className="w-full" onClick={() => {
              // TODO: Initiate OAuth flow
              window.open('/api/oauth/facebook', '_blank');
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Conectar com Facebook
            </Button>
          </div>
        );

      case 'telegram':
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bot_token">Token do Bot</Label>
              <Input
                id="bot_token"
                value={credentials.bot_token || ''}
                onChange={(e) => setCredentials({ ...credentials, bot_token: e.target.value })}
                placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              />
              <p className="text-xs text-muted-foreground">
                Obtenha o token criando um bot com @BotFather no Telegram
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot_username">Username do Bot</Label>
              <Input
                id="bot_username"
                value={credentials.bot_username || ''}
                onChange={(e) => setCredentials({ ...credentials, bot_username: e.target.value })}
                placeholder="@meu_bot"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channelType && <ChannelIcon type={channelType} size="md" showBackground />}
            Adicionar {channelType && getChannelLabel(channelType)}
          </DialogTitle>
          <DialogDescription>
            Configure as credenciais para conectar este canal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Canal</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Meu ${channelType && getChannelLabel(channelType)}`}
            />
          </div>

          {renderCredentialsForm()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =====================================================
// Configure Channel Dialog
// =====================================================

interface ConfigureChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
}

const ConfigureChannelDialog = ({
  open,
  onOpenChange,
  channel,
}: ConfigureChannelDialogProps) => {
  const { metrics } = useChannelHealth(channel.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChannelIcon type={channel.type} size="md" showBackground />
            Configurar {channel.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status & Health */}
          <div className="space-y-2">
            <h4 className="font-medium">Status do Canal</h4>
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {channel.total_conversations}
                </div>
                <div className="text-xs text-muted-foreground">Conversas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {channel.total_messages_sent + channel.total_messages_received}
                </div>
                <div className="text-xs text-muted-foreground">Mensagens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {metrics?.uptime || '100'}%
                </div>
                <div className="text-xs text-muted-foreground">Uptime 24h</div>
              </div>
            </div>
          </div>

          {/* Last Sync */}
          {channel.last_sync_at && (
            <div className="text-sm text-muted-foreground">
              Última sincronização:{' '}
              {formatDistanceToNow(new Date(channel.last_sync_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          )}

          {/* Error Message */}
          {channel.error_message && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              <strong>Erro:</strong> {channel.error_message}
            </div>
          )}

          {/* Channel-specific settings would go here */}
          <p className="text-sm text-muted-foreground">
            Configurações específicas para {getChannelLabel(channel.type)} em breve.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
