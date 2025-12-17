import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueues } from '@/hooks/useQueues';
import { Search, Users, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Agent = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_online: boolean;
  conversation_count: number;
};

type TransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentAssignedTo?: string | null;
  onSuccess: () => void;
};

const TransferDialog = ({
  open,
  onOpenChange,
  conversationId,
  currentAssignedTo,
  onSuccess,
}: TransferDialogProps) => {
  const { queues } = useQueues();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedQueue, setSelectedQueue] = useState<string>('');
  const [transferNote, setTransferNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    if (open) {
      loadAgents();
      loadCurrentUser();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredAgents(
        agents.filter((agent) => agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setFilteredAgents(agents);
    }
  }, [searchQuery, agents]);

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUserName(profile.full_name);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar empresa do usuário
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (!companyUser) return;

      // Buscar todos os usuários da empresa
      const { data: companyUsers, error: usersError } = await supabase
        .from('company_users')
        .select('user_id')
        .eq('company_id', companyUser.company_id);

      if (usersError) throw usersError;

      const userIds = companyUsers.map((cu) => cu.user_id);

      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Buscar status online
      const { data: statuses } = await supabase
        .from('agent_status')
        .select('user_id, status')
        .in('user_id', userIds);

      // Contar conversas por atendente
      const { data: conversations } = await supabase
        .from('conversations')
        .select('assigned_to')
        .eq('company_id', companyUser.company_id)
        .in('status', ['active', 'waiting']);

      const conversationCounts =
        conversations?.reduce(
          (acc, conv) => {
            if (conv.assigned_to) {
              acc[conv.assigned_to] = (acc[conv.assigned_to] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      const agentsData: Agent[] =
        profiles?.map((profile) => ({
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          is_online:
            statuses?.some((s) => s.user_id === profile.id && s.status === 'online') || false,
          conversation_count: conversationCounts[profile.id] || 0,
        })) || [];

      // Ordenar: online primeiro, depois por menor carga
      agentsData.sort((a, b) => {
        if (a.is_online !== b.is_online) {
          return a.is_online ? -1 : 1;
        }
        return a.conversation_count - b.conversation_count;
      });

      setAgents(agentsData);
      setFilteredAgents(agentsData);
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
    }
  };

  const handleTransferToAgent = async () => {
    if (!selectedAgent) {
      toast.error('Selecione um atendente');
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Atualizar conversa
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          assigned_to: selectedAgent,
          status: 'active' as const,
          queue_id: null,
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      // Buscar nome do novo atendente
      const { data: newAgent } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', selectedAgent)
        .single();

      // Criar nota de transferência
      const noteContent = `Conversa transferida de ${currentUserName} para ${newAgent?.full_name || 'outro atendente'}${transferNote ? `\nMotivo: ${transferNote}` : ''}`;

      const { error: noteError } = await supabase.from('conversation_notes').insert({
        conversation_id: conversationId,
        user_id: user?.id,
        note_type: 'transfer',
        content: noteContent,
        metadata: {
          from_user: currentAssignedTo,
          to_user: selectedAgent,
          transfer_reason: transferNote || null,
        },
      });

      if (noteError) throw noteError;

      // Notificar novo atendente
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user?.id)
        .eq('is_default', true)
        .single();

      if (companyUser) {
        await supabase.from('notifications').insert({
          user_id: selectedAgent,
          company_id: companyUser.company_id,
          title: 'Nova conversa transferida',
          message: `${currentUserName} transferiu uma conversa para você${transferNote ? `: ${transferNote}` : ''}`,
          type: 'info',
          entity_type: 'conversation',
          entity_id: conversationId,
          action_url: '/chat',
        });
      }

      toast.success(`Transferida para ${newAgent?.full_name}`);

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
      toast.error('Não foi possível transferir a conversa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferToQueue = async () => {
    if (!selectedQueue) {
      toast.error('Selecione uma fila');
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          queue_id: selectedQueue,
          assigned_to: null,
          status: 'waiting',
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      // Buscar nome da fila
      const queue = queues?.find((q) => q.id === selectedQueue);

      // Criar nota de transferência
      const noteContent = `Conversa transferida de ${currentUserName} para fila "${queue?.name}"${transferNote ? `\nMotivo: ${transferNote}` : ''}`;

      const { error: noteError } = await supabase.from('conversation_notes').insert({
        conversation_id: conversationId,
        user_id: user?.id,
        note_type: 'transfer',
        content: noteContent,
        metadata: {
          from_user: currentAssignedTo,
          to_queue: selectedQueue,
          transfer_reason: transferNote || null,
        },
      });

      if (noteError) throw noteError;

      toast.success(`Transferida para fila ${queue?.name}`);

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
      toast.error('Não foi possível transferir a conversa');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAgent('');
    setSelectedQueue('');
    setTransferNote('');
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Transferir Conversa</DialogTitle>
          <DialogDescription>
            Escolha para quem ou qual fila deseja transferir esta conversa
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="agent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agent">Atendente</TabsTrigger>
            <TabsTrigger value="queue">Fila</TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atendente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors',
                      selectedAgent === agent.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={agent.avatar_url || undefined} />
                        <AvatarFallback>
                          {agent.full_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {agent.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{agent.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.conversation_count} conversas
                      </div>
                    </div>
                    {agent.is_online && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Online
                      </Badge>
                    )}
                  </button>
                ))}
                {filteredAgents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum atendente encontrado
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nota para o próximo atendente (opcional)
              </label>
              <Textarea
                placeholder="Ex: Cliente quer falar sobre renovação de contrato..."
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleTransferToAgent} disabled={isLoading || !selectedAgent}>
                {isLoading ? 'Transferindo...' : 'Transferir'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {queues
                  ?.filter((q) => q.is_active)
                  .map((queue) => (
                    <button
                      key={queue.id}
                      onClick={() => setSelectedQueue(queue.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                        selectedQueue === queue.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: queue.color }}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{queue.name}</div>
                        {queue.description && (
                          <div className="text-sm text-muted-foreground">{queue.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Atribuição automática</span>
                      </div>
                    </button>
                  ))}
                {(!queues || queues.filter((q) => q.is_active).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma fila ativa encontrada
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da transferência (opcional)</label>
              <Textarea
                placeholder="Ex: Fila de suporte técnico para análise detalhada..."
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleTransferToQueue} disabled={isLoading || !selectedQueue}>
                {isLoading ? 'Transferindo...' : 'Transferir para Fila'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
