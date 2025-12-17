import { useState } from 'react';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Zap,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Clock,
  Target,
  MessageSquare,
} from 'lucide-react';
import { PlaybookFlowBuilder } from './PlaybookFlowBuilder';
import { Skeleton } from '@/components/ui/skeleton';

const triggerIcons = {
  manual: Play,
  stage_change: Target,
  time_inactive: Clock,
  keyword: MessageSquare,
  deal_created: Plus,
};

const triggerLabels = {
  manual: 'Manual',
  stage_change: 'Mudança de Stage',
  time_inactive: 'Tempo Inativo',
  keyword: 'Palavra-chave',
  deal_created: 'Deal Criado',
};

export const PlaybookList = () => {
  const { playbooks, isLoading, deletePlaybook, toggleActive } = usePlaybooks();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<any>(null);

  const handleEdit = (playbook: any) => {
    setEditingPlaybook(playbook);
    setBuilderOpen(true);
  };

  const handleNew = () => {
    setEditingPlaybook(null);
    setBuilderOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este playbook?')) {
      deletePlaybook.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-64 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Playbooks de Automação</h2>
          <p className="text-muted-foreground">
            Configure fluxos automáticos para otimizar seu processo de vendas
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Playbook
        </Button>
      </div>

      {playbooks.length === 0 ? (
        <Card className="p-12 text-center">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum playbook criado ainda</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro playbook para automatizar tarefas repetitivas
          </p>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Playbook
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {playbooks.map((playbook) => {
            const TriggerIcon = triggerIcons[playbook.trigger_type as keyof typeof triggerIcons];
            const stepsCount = Array.isArray(playbook.steps) ? playbook.steps.length : 0;

            return (
              <Card key={playbook.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{playbook.name}</h3>
                      <Badge variant={playbook.is_active ? 'default' : 'secondary'}>
                        {playbook.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TriggerIcon className="h-4 w-4" />
                        {triggerLabels[playbook.trigger_type as keyof typeof triggerLabels]}
                      </div>
                    </div>

                    {playbook.description && (
                      <p className="text-muted-foreground mb-3">{playbook.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {stepsCount} {stepsCount === 1 ? 'ação' : 'ações'}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Executado {playbook.usage_count || 0}x
                      </span>
                      {playbook.success_rate && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {playbook.success_rate}% sucesso
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={playbook.is_active}
                      onCheckedChange={(checked) =>
                        toggleActive.mutate({
                          id: playbook.id,
                          is_active: checked,
                        })
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(playbook)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(playbook.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PlaybookFlowBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        playbook={editingPlaybook}
      />
    </div>
  );
};
