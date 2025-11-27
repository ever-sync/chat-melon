import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { Trash2, UserX } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface BlockedContact {
  id: string;
  blocked_number: string;
  blocked_at: string;
  reason: string | null;
}

export function BlockedContactsManager() {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [blockedContacts, setBlockedContacts] = useState<BlockedContact[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [reason, setReason] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadBlockedContacts();
  }, [currentCompany]);

  const loadBlockedContacts = async () => {
    if (!currentCompany) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('blocked_contacts')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', currentCompany.id)
      .order('blocked_at', { ascending: false });

    if (error) {
      console.error('Error loading blocked contacts:', error);
      return;
    }

    setBlockedContacts(data || []);
  };

  const handleBlock = async () => {
    if (!currentCompany || !newNumber.trim()) {
      toast.error("Informe o número do contato");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('blocked_contacts')
      .insert({
        user_id: user.id,
        company_id: currentCompany.id,
        blocked_number: newNumber.trim(),
        reason: reason.trim() || null,
      });

    if (error) {
      toast.error("Erro ao bloquear contato");
      console.error('Error blocking contact:', error);
    } else {
      toast.success("Contato bloqueado com sucesso");
      setNewNumber("");
      setReason("");
      loadBlockedContacts();
    }
    setLoading(false);
  };

  const handleUnblock = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('blocked_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao desbloquear contato");
      console.error('Error unblocking contact:', error);
    } else {
      toast.success("Contato desbloqueado com sucesso");
      loadBlockedContacts();
    }
    setLoading(false);
    setDeleteId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contatos Bloqueados</CardTitle>
        <CardDescription>
          Gerencie contatos bloqueados e impeça comunicações indesejadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Número do Contato</Label>
            <Input
              id="phone-number"
              placeholder="5511999999999"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Motivo do bloqueio..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={handleBlock} disabled={loading} className="w-full">
            <UserX className="w-4 h-4 mr-2" />
            Bloquear Contato
          </Button>
        </div>

        <div className="space-y-3">
          {blockedContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum contato bloqueado
            </p>
          ) : (
            blockedContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{contact.blocked_number}</p>
                  {contact.reason && (
                    <p className="text-sm text-muted-foreground mt-1">{contact.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Bloqueado em {format(new Date(contact.blocked_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(contact.id)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desbloquear este contato? Ele poderá enviar mensagens novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleUnblock(deleteId)}>
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
