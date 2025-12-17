import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
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
import { X, Trash2, Move, UserPlus, Flag, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onMove: (stageId: string) => void;
  onAssign: (userId: string) => void;
  onSetPriority: (priority: string) => void;
  onDelete: () => void;
  pipelineId?: string;
}

export const BulkActionsToolbar = ({
  selectedCount,
  onClear,
  onMove,
  onAssign,
  onSetPriority,
  onDelete,
  pipelineId,
}: BulkActionsToolbarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);

  // Buscar stages do pipeline
  const { data: pipeline } = useQuery({
    queryKey: ['pipeline-stages', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return null;
      const { data } = await supabase
        .from('pipelines')
        .select('*, pipeline_stages(*)')
        .eq('id', pipelineId)
        .single();
      return data;
    },
    enabled: !!pipelineId,
  });

  // Buscar usuários
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data || [];
    },
  });

  const stages = ((pipeline as any)?.pipeline_stages || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-4">
          <Badge variant="secondary" className="text-sm font-semibold px-3">
            {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
          </Badge>

          <div className="flex items-center gap-2">
            {/* Mover para Stage */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMoveDialog(true)}
              className="text-white hover:bg-white/20"
            >
              <Move className="h-4 w-4 mr-2" />
              Mover
            </Button>

            {/* Atribuir Responsável */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAssignDialog(true)}
              className="text-white hover:bg-white/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Atribuir
            </Button>

            {/* Alterar Prioridade */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPriorityDialog(true)}
              className="text-white hover:bg-white/20"
            >
              <Flag className="h-4 w-4 mr-2" />
              Prioridade
            </Button>

            {/* Mais Ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-6 w-px bg-white/30" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog de Mover */}
      <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para outro stage</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o stage de destino para {selectedCount} negócio
              {selectedCount > 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select
            onValueChange={(value) => {
              onMove(value);
              setShowMoveDialog(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage: any) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Atribuir */}
      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atribuir responsável</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o responsável para {selectedCount} negócio
              {selectedCount > 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select
            onValueChange={(value) => {
              onAssign(value);
              setShowAssignDialog(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Prioridade */}
      <AlertDialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar prioridade</AlertDialogTitle>
            <AlertDialogDescription>
              Defina a prioridade para {selectedCount} negócio
              {selectedCount > 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select
            onValueChange={(value) => {
              onSetPriority(value);
              setShowPriorityDialog(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir negócios?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {selectedCount} negócio
              {selectedCount > 1
                ? 's serão permanentemente excluídos'
                : ' será permanentemente excluído'}
              , incluindo todas as notas, tarefas e arquivos vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedCount} Negócio{selectedCount > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
