import { useState, useEffect } from 'react';
import { useQueueMembers } from '@/hooks/useQueues';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QueueMembersModalProps {
  open: boolean;
  onClose: () => void;
  queueId: string;
}

export const QueueMembersModal = ({ open, onClose, queueId }: QueueMembersModalProps) => {
  const { members, addMember, updateMember, removeMember } = useQueueMembers(queueId);
  const { getCompanyId } = useCompanyQuery();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [maxConversations, setMaxConversations] = useState<number | null>(null);

  const { data: availableUsers } = useQuery({
    queryKey: ['company-users', getCompanyId()],
    queryFn: async () => {
      // Get all user_ids from company_users
      const { data: companyUsers, error: companyError } = await supabase
        .from('company_users')
        .select('user_id')
        .eq('company_id', getCompanyId());

      if (companyError) throw companyError;

      if (!companyUsers || companyUsers.length === 0) return [];

      // Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in(
          'id',
          companyUsers.map((cu) => cu.user_id)
        );

      if (profilesError) throw profilesError;

      return profiles.map((profile) => ({
        user_id: profile.id,
        profiles: profile,
      }));
    },
    enabled: !!getCompanyId() && open,
  });

  const usersNotInQueue = availableUsers?.filter(
    (user) => !members?.some((member) => member.user_id === user.profiles.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    await addMember({
      queue_id: queueId,
      user_id: selectedUserId,
      max_conversations: maxConversations,
      is_active: true,
    });

    setSelectedUserId('');
    setMaxConversations(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Membros da Fila</DialogTitle>
          <DialogDescription>
            Adicione ou remova membros desta fila de atendimento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Member Form */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar Membro
            </h3>

            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usersNotInQueue?.map((user) => (
                    <SelectItem key={user.profiles.id} value={user.profiles.id || ''}>
                      {user.profiles.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Máximo de Conversas (opcional)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Deixe vazio para usar o padrão da fila"
                value={maxConversations || ''}
                onChange={(e) =>
                  setMaxConversations(e.target.value ? parseInt(e.target.value) : null)
                }
              />
            </div>

            <Button onClick={handleAddMember} disabled={!selectedUserId} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Membros Atuais ({members?.length || 0})</h3>

            {!members || members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum membro nesta fila
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profiles?.avatar_url || ''} />
                        <AvatarFallback>{member.profiles?.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Máx: {member.max_conversations || 'Padrão da fila'} conversas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={member.is_active}
                        onCheckedChange={(checked) =>
                          updateMember({
                            id: member.id,
                            is_active: checked,
                          })
                        }
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeMember(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
