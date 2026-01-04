import { useState, useEffect } from 'react';
import { Check, UserPlus, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConversationAssignment } from '@/hooks/useConversationAssignment';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ConversationActionsProps {
  conversationId: string;
  assignedTo?: string | null;
  status?: string;
  onResolve?: () => void;
}

export const ConversationActions = ({
  conversationId,
  assignedTo,
  status,
  onResolve,
}: ConversationActionsProps) => {
  const { currentCompany } = useCompany();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { assignConversation, resolveConversation, reopenConversation } =
    useConversationAssignment(conversationId);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Carregar usuário atual
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Buscar membros da equipe
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('company_members')
        .select(
          `
          id,
          user_id,
          role,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('role');

      if (!error && data) {
        setTeamMembers(data as TeamMember[]);

        // Verificar se o usuário atual é admin
        const userMember = data.find((m) => m.user_id === currentUserId);
        if (userMember) {
          setIsAdmin(['owner', 'admin', 'manager', 'supervisor'].includes(userMember.role));
        }
      }
    };

    fetchTeamMembers();
  }, [currentCompany?.id, currentUserId]);

  const handleAssign = (userId: string) => {
    assignConversation.mutate(userId);
  };

  const handleResolve = () => {
    resolveConversation.mutate(undefined, {
      onSuccess: () => {
        if (onResolve) onResolve();
      },
    });
  };

  const handleReopen = () => {
    reopenConversation.mutate();
  };

  // Se a conversa está fechada, mostrar apenas botão de reabrir (somente para admin)
  if (status === 'closed') {
    if (!isAdmin) return null;

    return (
      <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
        <Button
          onClick={handleReopen}
          disabled={reopenConversation.isPending}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reabrir Conversa
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 border-b bg-white">
      {/* Seleção de atendente - apenas para admin */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-1">
          <UserPlus className="h-4 w-4 text-gray-500" />
          <Select
            value={assignedTo || 'unassigned'}
            onValueChange={(value) => {
              if (value !== 'unassigned') {
                handleAssign(value);
              }
            }}
            disabled={assignConversation.isPending}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Atribuir a..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Não atribuída</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.profiles?.full_name || 'Sem nome'}
                  <span className="text-xs text-gray-500 ml-2">
                    ({member.role})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Informação de atribuição para não-admin */}
      {!isAdmin && assignedTo && (
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-1">
          <UserPlus className="h-4 w-4" />
          <span>
            Atribuída para:{' '}
            {teamMembers.find((m) => m.user_id === assignedTo)?.profiles
              ?.full_name || 'Você'}
          </span>
        </div>
      )}

      {/* Botões de Ação - para atendente responsável ou admin */}
      {(assignedTo === currentUserId || isAdmin) && (
        <div className="flex items-center gap-2">
          <Button
            onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke('send-satisfaction-survey', {
                  body: { conversation_id: conversationId },
                });
                if (error) throw error;
                toast.success('Pesquisa de satisfação enviada!');
              } catch (error) {
                console.error('Erro ao enviar pesquisa:', error);
                toast.error('Erro ao enviar pesquisa.');
              }
            }}
            variant="outline"
            size="sm"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Star className="h-4 w-4 mr-2" />
            Pedir Avaliação
          </Button>

          <Button
            onClick={handleResolve}
            disabled={resolveConversation.isPending}
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar como Resolvido
          </Button>
        </div>
      )}
    </div>
  );
};
