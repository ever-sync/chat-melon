import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface MessageActionsProps {
  messageId: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  onUpdated: () => void;
}

export function MessageActions({ messageId, content, timestamp, isFromMe, onUpdated }: MessageActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [loading, setLoading] = useState(false);

  if (!isFromMe) return null;

  // Check if message is within 15 minutes
  const messageTime = new Date(timestamp).getTime();
  const now = new Date().getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  const canEdit = now - messageTime < fifteenMinutes;

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const { error } = await supabase.functions.invoke('evolution-edit-message', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          messageId,
          newContent: editContent.trim(),
        },
      });

      if (error) throw error;

      toast.success("Mensagem editada com sucesso");

      setShowEditDialog(false);
      onUpdated();
    } catch (error: any) {
      console.error('Erro ao editar mensagem:', error);
      toast.error(error.message || "Erro ao editar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deleteForEveryone: boolean) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const { error } = await supabase.functions.invoke('evolution-delete-message', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          messageId,
          deleteForEveryone,
        },
      });

      if (error) throw error;

      toast.success(deleteForEveryone ? "Mensagem apagada para todos" : "Mensagem apagada");

      setShowDeleteDialog(false);
      onUpdated();
    } catch (error: any) {
      console.error('Erro ao apagar mensagem:', error);
      toast.error(error.message || "Erro ao apagar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Apagar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={loading || !editContent.trim()}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar mensagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha como deseja apagar esta mensagem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(false)} disabled={loading}>
              Apagar para mim
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleDelete(true)} disabled={loading}>
              Apagar para todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}