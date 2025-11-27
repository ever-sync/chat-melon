import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, UserMinus, Crown, ShieldOff } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

export function GroupManager() {
  const { currentCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [participants, setParticipants] = useState("");

  const createGroup = async () => {
    if (!groupName || !participants) {
      toast.error("Preencha nome e participantes");
      return;
    }

    if (!currentCompany) {
      toast.error("Selecione uma empresa");
      return;
    }

    setLoading(true);
    try {
      const participantsList = participants.split(',').map(p => p.trim());

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('evolution-group-manager', {
        body: {
          action: 'create',
          companyId: currentCompany.id,
          name: groupName,
          description: groupDescription,
          participants: participantsList
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      // Salvar grupo no banco
      await supabase.from('groups').insert({
        company_id: currentCompany.id,
        group_id: data.result.groupJid,
        name: groupName,
        description: groupDescription,
        owner_number: data.result.owner
      });

      toast.success("Grupo criado!");
      setOpen(false);
      setGroupName("");
      setGroupDescription("");
      setParticipants("");
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error("Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Criar Grupo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome do Grupo</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Equipe de Vendas"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Descrição do grupo (opcional)"
            />
          </div>

          <div>
            <Label>Participantes (separados por vírgula)</Label>
            <Textarea
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="5511999999999, 5511888888888"
            />
          </div>

          <Button onClick={createGroup} disabled={loading} className="w-full">
            Criar Grupo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GroupActionsProps {
  groupId: string;
  companyId: string;
}

export function GroupActions({ groupId, companyId }: GroupActionsProps) {
  const [participantNumber, setParticipantNumber] = useState("");

  const handleAction = async (action: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('evolution-group-manager', {
        body: {
          action,
          companyId,
          groupId,
          participant: participantNumber
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      toast.success("Ação realizada!");
      setParticipantNumber("");
    } catch (error) {
      console.error('Group action error:', error);
      toast.error("Erro ao executar ação");
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <div>
        <Label>Número do Participante</Label>
        <Input
          value={participantNumber}
          onChange={(e) => setParticipantNumber(e.target.value)}
          placeholder="5511999999999"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => handleAction('addParticipant')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
        <Button variant="outline" onClick={() => handleAction('removeParticipant')}>
          <UserMinus className="h-4 w-4 mr-2" />
          Remover
        </Button>
        <Button variant="outline" onClick={() => handleAction('promoteParticipant')}>
          <Crown className="h-4 w-4 mr-2" />
          Promover Admin
        </Button>
        <Button variant="outline" onClick={() => handleAction('demoteParticipant')}>
          <ShieldOff className="h-4 w-4 mr-2" />
          Rebaixar Admin
        </Button>
      </div>
    </div>
  );
}