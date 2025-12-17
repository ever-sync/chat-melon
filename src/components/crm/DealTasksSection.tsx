import { useState } from 'react';
import { useDealTasks, type DealTaskPriority } from '@/hooks/crm/useDealTasks';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskModal } from '@/components/tasks/TaskModal';
import type { TablesInsert } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface DealTasksSectionProps {
  dealId: string;
}

export const DealTasksSection = ({ dealId }: DealTasksSectionProps) => {
  const { currentCompany } = useCompany();
  const {
    tasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    isLoading,
    createTask,
    completeTask,
    reopenTask,
    deleteTask,
  } = useDealTasks(dealId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // TaskModal expects a function that returns Promise<Task>
  const handleCreateTask = async (data: TablesInsert<'tasks'>) => {
    // Add deal_id to the task data
    const taskData = {
      ...data,
      deal_id: dealId,
      company_id: currentCompany?.id,
    };

    // Insert task directly through supabase and return it
    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    // Invalidate queries to refresh the list
    createTask.mutate(taskData as any);

    return newTask;
  };

  const getPriorityColor = (priority: DealTaskPriority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    };
    return colors[priority];
  };

  const getPriorityLabel = (priority: DealTaskPriority) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority];
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerta de tarefas atrasadas */}
      {overdueTasks.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Você tem {overdueTasks.length} tarefa(s) atrasada(s) neste negócio.
          </AlertDescription>
        </Alert>
      )}

      {/* Tarefas pendentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Tarefas Pendentes ({pendingTasks.length})</h4>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nova Tarefa
          </Button>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa pendente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 p-3 border rounded-lg transition-colors hover:bg-muted/50',
                  isOverdue(task.due_date) && 'border-red-200 bg-red-50/50 dark:bg-red-900/10'
                )}
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => completeTask.mutate(task.id)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-medium text-sm">{task.title}</p>

                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>

                    {task.due_date && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          isOverdue(task.due_date) &&
                            'border-red-500 text-red-600 dark:text-red-400'
                        )}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(task.due_date), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </Badge>
                    )}

                    {task.assigned_profile && (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.assigned_profile.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(task.assigned_profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {task.assigned_profile.full_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteTask.mutate(task.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tarefas concluídas (colapsável) */}
      {completedTasks.length > 0 && (
        <Collapsible open={showCompletedTasks} onOpenChange={setShowCompletedTasks}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="text-sm font-semibold">
                Tarefas Concluídas ({completedTasks.length})
              </span>
              {showCompletedTasks ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 border rounded-lg opacity-60"
              >
                <Checkbox checked={true} disabled />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-through">{task.title}</p>
                  {task.completed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Concluída em{' '}
                      {format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>

                <Button size="sm" variant="ghost" onClick={() => reopenTask.mutate(task.id)}>
                  Reabrir
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Modal de criar tarefa - usando TaskModal existente */}
      <TaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateTask}
        defaultDealId={dealId}
      />
    </div>
  );
};
