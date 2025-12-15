import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  CheckCircle,
  X,
  UserPlus,
  Tag,
  MoreHorizontal,
  Mail,
  MailOpen,
  Trash2,
  Archive,
  Loader2,
} from 'lucide-react';
import { useBulkConversationActions } from '@/hooks/chat/useBulkConversationActions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { cn } from '@/lib/utils';

interface BulkActionsToolbarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  availableLabels?: string[];
}

export const BulkActionsToolbar = ({
  selectedIds,
  onClearSelection,
  availableLabels = [],
}: BulkActionsToolbarProps) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { companyId } = useCompanyQuery();

  const {
    bulkResolve,
    bulkClose,
    bulkAssign,
    bulkAddLabel,
    bulkRemoveLabel,
    bulkMarkAsRead,
    bulkMarkAsUnread,
    isProcessing,
  } = useBulkConversationActions();

  // Get team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_members')
        .select(`
          user_id,
          profiles:profiles!company_members_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('company_id', companyId);

      if (error) throw error;
      return data.map((m) => ({
        id: m.user_id,
        name: m.profiles?.full_name || 'Sem nome',
        avatar: m.profiles?.avatar_url,
      }));
    },
    enabled: !!companyId,
  });

  const selectedCount = selectedIds.size;
  const idsArray = Array.from(selectedIds);

  if (selectedCount === 0) return null;

  const handleAssign = async () => {
    if (!selectedUserId) return;
    await bulkAssign.mutateAsync({ ids: idsArray, userId: selectedUserId });
    setShowAssignDialog(false);
    setSelectedUserId('');
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-2 p-3 bg-primary/10 border-b border-primary/20',
          'animate-in slide-in-from-top-2 duration-200'
        )}
      >
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {selectedCount} selecionadas
          </Badge>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bulkResolve.mutate(idsArray)}
              disabled={isProcessing}
              className="gap-2"
            >
              {bulkResolve.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Resolver
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAssignDialog(true)}
              disabled={isProcessing}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Atribuir
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isProcessing}>
                  <Tag className="h-4 w-4 mr-2" />
                  Labels
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Tag className="h-4 w-4 mr-2" />
                    Adicionar label
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {availableLabels.length > 0 ? (
                      availableLabels.map((label) => (
                        <DropdownMenuItem
                          key={label}
                          onClick={() =>
                            bulkAddLabel.mutate({ ids: idsArray, label })
                          }
                        >
                          {label}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        Nenhuma label disponível
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <X className="h-4 w-4 mr-2" />
                    Remover label
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {availableLabels.length > 0 ? (
                      availableLabels.map((label) => (
                        <DropdownMenuItem
                          key={label}
                          onClick={() =>
                            bulkRemoveLabel.mutate({ ids: idsArray, label })
                          }
                        >
                          {label}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        Nenhuma label disponível
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isProcessing}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => bulkMarkAsRead.mutate(idsArray)}
                >
                  <MailOpen className="h-4 w-4 mr-2" />
                  Marcar como lidas
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => bulkMarkAsUnread.mutate(idsArray)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Marcar como não lidas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => bulkClose.mutate(idsArray)}
                  className="text-destructive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Fechar conversas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Conversas</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Atribuir {selectedCount} conversas a:
            </p>

            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro da equipe" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || bulkAssign.isPending}
            >
              {bulkAssign.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
