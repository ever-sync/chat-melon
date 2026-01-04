import { useState } from 'react';
import { useAIAgents, useDeleteAIAgent, usePauseAIAgent, useActivateAIAgent, useDuplicateAIAgent } from '@/hooks/ai-agents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Bot,
  Plus,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Pause,
  Play,
  BarChart3,
  Settings2,
  MessageSquare,
  Users,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { AIAgent, AI_AGENT_TYPE_LABELS, AI_AGENT_STATUS_LABELS, getAgentStatusColor } from '@/types/ai-agents';
import { cn } from '@/lib/utils';

interface AgentListProps {
  onCreateAgent: () => void;
  onEditAgent: (agent: AIAgent) => void;
  onViewMetrics: (agent: AIAgent) => void;
  onConfigureChannels: (agent: AIAgent) => void;
}

export function AgentList({ onCreateAgent, onEditAgent, onViewMetrics, onConfigureChannels }: AgentListProps) {
  const { data: agents, isLoading } = useAIAgents();
  const deleteAgent = useDeleteAIAgent();
  const pauseAgent = usePauseAIAgent();
  const activateAgent = useActivateAIAgent();
  const duplicateAgent = useDuplicateAIAgent();

  const [agentToDelete, setAgentToDelete] = useState<AIAgent | null>(null);

  const handleDelete = async () => {
    if (agentToDelete) {
      await deleteAgent.mutateAsync(agentToDelete.id);
      setAgentToDelete(null);
    }
  };

  const getStatusBadge = (status: AIAgent['status']) => {
    const color = getAgentStatusColor(status);
    const variants: Record<string, string> = {
      green: 'bg-green-100 text-green-700 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
      red: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
      <Badge variant="outline" className={cn('font-medium', variants[color])}>
        {AI_AGENT_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const getStatusIcon = (status: AIAgent['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'training':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!agents?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-purple-100 p-4 mb-4">
            <Bot className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum agente criado</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Crie seu primeiro agente de IA para automatizar o atendimento nos seus canais de comunicação.
          </p>
          <Button onClick={onCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Agente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card de Criar Novo */}
        <Card
          className="border-dashed cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
          onClick={onCreateAgent}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="rounded-full bg-purple-100 p-3 mb-3">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
            <p className="font-medium text-gray-700">Criar Novo Agente</p>
            <p className="text-sm text-muted-foreground">Configure um assistente de IA</p>
          </CardContent>
        </Card>

        {/* Lista de Agentes */}
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={agent.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                      <Bot className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {agent.name}
                      {getStatusIcon(agent.status)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {AI_AGENT_TYPE_LABELS[agent.agent_type]}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditAgent(agent)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onConfigureChannels(agent)}>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configurar Canais
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewMetrics(agent)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Ver Métricas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {agent.status === 'active' ? (
                      <DropdownMenuItem onClick={() => pauseAgent.mutate(agent.id)}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </DropdownMenuItem>
                    ) : agent.status !== 'draft' ? (
                      <DropdownMenuItem onClick={() => activateAgent.mutate(agent.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Ativar
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={() => duplicateAgent.mutate(agent.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setAgentToDelete(agent)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Arquivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {agent.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
              )}

              <div className="flex items-center justify-between">
                {getStatusBadge(agent.status)}
                <span className="text-xs text-muted-foreground">v{agent.version}</span>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{agent.total_sessions || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sessões</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{agent.total_handoffs || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Handoffs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {agent.resolution_rate ? `${Math.round(agent.resolution_rate * 100)}%` : '-'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Resolução</p>
                </div>
              </div>

              {/* Canais Vinculados */}
              {agent.channels && agent.channels.length > 0 && (
                <div className="flex items-center gap-1 pt-2 border-t">
                  <span className="text-xs text-muted-foreground mr-1">Canais:</span>
                  {agent.channels.slice(0, 3).map((ac) => (
                    <Badge key={ac.id} variant="secondary" className="text-xs">
                      {ac.channel?.name || ac.channel?.type}
                    </Badge>
                  ))}
                  {agent.channels.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{agent.channels.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Confirmação de Delete */}
      <AlertDialog open={!!agentToDelete} onOpenChange={() => setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Agente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar o agente "{agentToDelete?.name}"?
              O agente será desativado e não atenderá mais nenhum canal.
              Os dados históricos serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
