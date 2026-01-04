import { useState } from 'react';
import { useAIAgentChannels, useAddAgentChannel, useUpdateAgentChannel, useRemoveAgentChannel } from '@/hooks/ai-agents';
import { useChannels } from '@/hooks/chat/useChannels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Plus,
  MoreVertical,
  Settings2,
  Trash2,
  Smartphone,
  Globe,
  Mail,
  Send,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { AIAgent, AIAgentChannel, AITriggerType } from '@/types/ai-agents';
import { cn } from '@/lib/utils';

interface AgentChannelConfigProps {
  agent: AIAgent;
}

const TRIGGER_TYPE_LABELS: Record<AITriggerType, string> = {
  always: 'Sempre Ativo',
  keyword: 'Por Palavra-chave',
  schedule: 'Por Horário',
  channel: 'Por Canal',
  tag: 'Por Tag do Contato',
  no_agent_available: 'Sem Agente Disponível',
  after_hours: 'Fora do Horário',
  queue_threshold: 'Fila Grande',
  manual: 'Ativação Manual',
};

const CHANNEL_ICONS: Record<string, typeof MessageSquare> = {
  whatsapp: Smartphone,
  instagram: Globe,
  messenger: MessageSquare,
  telegram: Send,
  email: Mail,
  widget: Globe,
};

export function AgentChannelConfig({ agent }: AgentChannelConfigProps) {
  const { data: agentChannels, isLoading: loadingAgentChannels } = useAIAgentChannels(agent.id);
  const { data: allChannels, isLoading: loadingChannels } = useChannels();
  const addChannel = useAddAgentChannel();
  const updateChannel = useUpdateAgentChannel();
  const removeChannel = useRemoveAgentChannel();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<AIAgentChannel | null>(null);

  // Formulário para adicionar canal
  const [newChannelId, setNewChannelId] = useState('');
  const [newTriggerType, setNewTriggerType] = useState<AITriggerType>('always');
  const [newWelcomeMessage, setNewWelcomeMessage] = useState('');
  const [newPriority, setNewPriority] = useState(1);

  // Canais disponíveis (não vinculados ao agente)
  const availableChannels = allChannels?.filter(
    (ch) => !agentChannels?.some((ac) => ac.channel_id === ch.id)
  ) || [];

  const handleAddChannel = async () => {
    if (!newChannelId) return;

    await addChannel.mutateAsync({
      agent_id: agent.id,
      channel_id: newChannelId,
      is_enabled: true,
      priority: newPriority,
      trigger_type: newTriggerType,
      trigger_config: {},
      welcome_message: newWelcomeMessage || undefined,
    });

    setShowAddDialog(false);
    resetAddForm();
  };

  const handleUpdateChannel = async () => {
    if (!selectedChannel) return;

    await updateChannel.mutateAsync({
      id: selectedChannel.id,
      agent_id: agent.id,
      is_enabled: selectedChannel.is_enabled,
      priority: selectedChannel.priority,
      trigger_type: selectedChannel.trigger_type,
      trigger_config: selectedChannel.trigger_config,
      welcome_message: selectedChannel.welcome_message,
      channel_specific_prompt: selectedChannel.channel_specific_prompt,
    });

    setShowConfigDialog(false);
    setSelectedChannel(null);
  };

  const handleRemoveChannel = async (channelConfig: AIAgentChannel) => {
    await removeChannel.mutateAsync({
      id: channelConfig.id,
      agent_id: agent.id,
    });
  };

  const handleToggleEnabled = async (channelConfig: AIAgentChannel) => {
    await updateChannel.mutateAsync({
      id: channelConfig.id,
      agent_id: agent.id,
      is_enabled: !channelConfig.is_enabled,
    });
  };

  const resetAddForm = () => {
    setNewChannelId('');
    setNewTriggerType('always');
    setNewWelcomeMessage('');
    setNewPriority(1);
  };

  const getChannelIcon = (type: string) => {
    const Icon = CHANNEL_ICONS[type] || MessageSquare;
    return Icon;
  };

  const getChannelStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      connected: 'bg-green-100 text-green-700',
      disconnected: 'bg-red-100 text-red-700',
      connecting: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
    };
    return (
      <Badge variant="outline" className={cn('text-xs', variants[status] || 'bg-gray-100')}>
        {status === 'connected' ? 'Conectado' : status === 'disconnected' ? 'Desconectado' : status}
      </Badge>
    );
  };

  if (loadingAgentChannels || loadingChannels) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Carregando canais...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Canais Vinculados
              </CardTitle>
              <CardDescription>
                Configure em quais canais este agente irá atuar
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} disabled={availableChannels.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Canal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!agentChannels?.length ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum canal vinculado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione canais para que o agente comece a atender
              </p>
              {availableChannels.length > 0 ? (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Canal
                </Button>
              ) : (
                <p className="text-sm text-yellow-600">
                  Você precisa criar canais primeiro em Configurações {'>'} Canais
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {agentChannels.map((ac) => {
                const Icon = getChannelIcon(ac.channel?.type || 'whatsapp');
                return (
                  <div
                    key={ac.id}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-lg',
                      ac.is_enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'p-2 rounded-lg',
                        ac.channel?.type === 'whatsapp' ? 'bg-green-100' :
                        ac.channel?.type === 'instagram' ? 'bg-pink-100' :
                        ac.channel?.type === 'telegram' ? 'bg-blue-100' :
                        'bg-gray-100'
                      )}>
                        <Icon className={cn(
                          'h-5 w-5',
                          ac.channel?.type === 'whatsapp' ? 'text-green-600' :
                          ac.channel?.type === 'instagram' ? 'text-pink-600' :
                          ac.channel?.type === 'telegram' ? 'text-blue-600' :
                          'text-gray-600'
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ac.channel?.name || 'Canal'}</span>
                          {getChannelStatusBadge(ac.channel?.status || 'disconnected')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{ac.channel?.type}</span>
                          <span>•</span>
                          <span>{TRIGGER_TYPE_LABELS[ac.trigger_type]}</span>
                          <span>•</span>
                          <span>Prioridade: {ac.priority}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {ac.is_enabled ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          checked={ac.is_enabled}
                          onCheckedChange={() => handleToggleEnabled(ac)}
                        />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedChannel(ac);
                            setShowConfigDialog(true);
                          }}>
                            <Settings2 className="h-4 w-4 mr-2" />
                            Configurar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveChannel(ac)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {agent.status !== 'active' && agentChannels && agentChannels.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Agente não publicado</p>
                <p className="mt-1">
                  O agente está configurado nos canais mas só começará a atender após ser publicado.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Canal */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Canal</DialogTitle>
            <DialogDescription>
              Selecione um canal para o agente atuar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={newChannelId} onValueChange={setNewChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((ch) => {
                    const Icon = getChannelIcon(ch.type);
                    return (
                      <SelectItem key={ch.id} value={ch.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{ch.name}</span>
                          <span className="text-muted-foreground capitalize">({ch.type})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gatilho de Ativação</Label>
              <Select value={newTriggerType} onValueChange={(v) => setNewTriggerType(v as AITriggerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Se múltiplos agentes estão no canal, o de maior prioridade atende primeiro
              </p>
            </div>

            <div className="space-y-2">
              <Label>Mensagem de Boas-vindas (opcional)</Label>
              <Textarea
                placeholder="Olá! Sou o assistente virtual. Como posso ajudar?"
                value={newWelcomeMessage}
                onChange={(e) => setNewWelcomeMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddChannel} disabled={!newChannelId || addChannel.isPending}>
              {addChannel.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Configurar Canal */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Canal</DialogTitle>
            <DialogDescription>
              Ajuste as configurações específicas para este canal
            </DialogDescription>
          </DialogHeader>

          {selectedChannel && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {(() => {
                  const Icon = getChannelIcon(selectedChannel.channel?.type || 'whatsapp');
                  return <Icon className="h-6 w-6 text-gray-600" />;
                })()}
                <div>
                  <p className="font-medium">{selectedChannel.channel?.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedChannel.channel?.type}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gatilho de Ativação</Label>
                <Select
                  value={selectedChannel.trigger_type}
                  onValueChange={(v) => setSelectedChannel({
                    ...selectedChannel,
                    trigger_type: v as AITriggerType
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={selectedChannel.priority}
                  onChange={(e) => setSelectedChannel({
                    ...selectedChannel,
                    priority: parseInt(e.target.value) || 1
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <Textarea
                  placeholder="Mensagem enviada no início da conversa..."
                  value={selectedChannel.welcome_message || ''}
                  onChange={(e) => setSelectedChannel({
                    ...selectedChannel,
                    welcome_message: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Prompt Específico do Canal (adicional)</Label>
                <Textarea
                  placeholder="Instruções adicionais para este canal específico..."
                  value={selectedChannel.channel_specific_prompt || ''}
                  onChange={(e) => setSelectedChannel({
                    ...selectedChannel,
                    channel_specific_prompt: e.target.value
                  })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Este prompt será adicionado ao prompt principal do agente
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativo neste canal</Label>
                  <p className="text-sm text-muted-foreground">
                    O agente responderá mensagens neste canal
                  </p>
                </div>
                <Switch
                  checked={selectedChannel.is_enabled}
                  onCheckedChange={(checked) => setSelectedChannel({
                    ...selectedChannel,
                    is_enabled: checked
                  })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateChannel} disabled={updateChannel.isPending}>
              {updateChannel.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
