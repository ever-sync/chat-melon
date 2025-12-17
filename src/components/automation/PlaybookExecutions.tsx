import { usePlaybookExecutions } from '@/hooks/usePlaybooks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Pause,
  ChevronDown,
  ChevronUp,
  Play,
  X,
  Target,
  Search,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const statusIcons = {
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  paused: Pause,
};

const statusColors = {
  running: 'default',
  completed: 'default',
  failed: 'destructive',
  paused: 'secondary',
} as const;

const statusLabels = {
  running: 'Executando',
  completed: 'Concluído',
  failed: 'Falhou',
  paused: 'Pausado',
};

export const PlaybookExecutions = ({ playbookId }: { playbookId?: string }) => {
  const { executions, isLoading, refetch } = usePlaybookExecutions(playbookId);
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleReExecute = async (executionId: string, fromStep?: number) => {
    try {
      const { data: execution } = await supabase
        .from('playbook_executions')
        .select('*, playbooks(*), deals(*)')
        .eq('id', executionId)
        .single();

      if (!execution) throw new Error('Execução não encontrada');

      // Criar nova execução
      const { data: newExecution, error } = await supabase
        .from('playbook_executions')
        .insert({
          playbook_id: execution.playbook_id,
          deal_id: execution.deal_id,
          conversation_id: execution.conversation_id,
          triggered_by: execution.triggered_by,
          status: 'running',
          current_step: fromStep || 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Chamar edge function para executar
      await supabase.functions.invoke('execute-playbook', {
        body: { executionId: newExecution.id },
      });

      toast.success('Automação reexecutada com sucesso');
      refetch();
    } catch (error) {
      console.error('Error re-executing playbook:', error);
      toast.error('Erro ao reexecutar automação');
    }
  };

  const handleCancel = async (executionId: string) => {
    try {
      const { error } = await supabase
        .from('playbook_executions')
        .update({ status: 'failed', error_message: 'Cancelado pelo usuário' })
        .eq('id', executionId);

      if (error) throw error;

      toast.success('Execução cancelada');
      refetch();
    } catch (error) {
      console.error('Error canceling execution:', error);
      toast.error('Erro ao cancelar execução');
    }
  };

  const filteredExecutions = executions.filter((execution) => {
    if (statusFilter !== 'all' && execution.status !== statusFilter) return false;

    const dealTitle = execution.deals?.title?.toLowerCase() || '';
    const contactName = execution.deals?.contacts?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    if (searchQuery && !dealTitle.includes(query) && !contactName.includes(query)) {
      return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>Nenhuma execução ainda</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por contato ou deal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="running">Executando</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="failed">Erro</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredExecutions.map((execution) => {
          const StatusIcon = statusIcons[execution.status as keyof typeof statusIcons];
          const dealTitle = execution.deals?.title || 'Deal sem título';
          const contactName = execution.deals?.contacts?.name || 'Contato';
          const isExpanded = expandedId === execution.id;
          const stepsLog = (execution.steps_log as any[]) || [];

          const duration = execution.completed_at
            ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
            : Date.now() - new Date(execution.started_at).getTime();

          const durationText =
            duration < 60000
              ? `${Math.floor(duration / 1000)}s`
              : duration < 3600000
                ? `${Math.floor(duration / 60000)}min`
                : duration < 86400000
                  ? `${Math.floor(duration / 3600000)}h`
                  : `${Math.floor(duration / 86400000)} dias`;

          return (
            <Card key={execution.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{execution.playbooks?.name || 'Playbook'}</span>
                      <Badge variant={statusColors[execution.status as keyof typeof statusColors]}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusLabels[execution.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {dealTitle} • {contactName}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Iniciado{' '}
                        {formatDistanceToNow(new Date(execution.started_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      <span>•</span>
                      <span>Duração: {durationText}</span>
                      {execution.current_step !== null && (
                        <>
                          <span>•</span>
                          <span>Step {execution.current_step}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {execution.status === 'running' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(execution.id)}
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {(execution.status === 'failed' || execution.status === 'completed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReExecute(execution.id)}
                        title="Reexecutar"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {execution.deals && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/crm`)}
                        title="Ver deal"
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : execution.id)}
                      title={isExpanded ? 'Fechar' : 'Ver detalhes'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {execution.error_message && (
                  <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                    {execution.error_message}
                  </div>
                )}

                {isExpanded && stepsLog.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <h4 className="font-medium text-sm">Detalhes da Execução</h4>
                    {stepsLog.map((log: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 text-sm ${
                          log.status === 'error' ? 'text-destructive' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : log.status === 'error' ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            Step {log.step + 1}: {log.type}
                          </div>
                          {log.timestamp && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), 'dd/MM HH:mm:ss')}
                            </div>
                          )}
                          {log.error && (
                            <div className="text-xs mt-1 text-destructive">Erro: {log.error}</div>
                          )}
                        </div>
                        {log.status === 'error' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReExecute(execution.id, log.step)}
                            title="Reexecutar a partir deste step"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
