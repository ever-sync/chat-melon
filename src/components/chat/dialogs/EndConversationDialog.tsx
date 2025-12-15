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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type EndConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onSuccess: () => void;
};

const EndConversationDialog = ({
  open,
  onOpenChange,
  conversationId,
  onSuccess,
}: EndConversationDialogProps) => {
  const handleEndConversation = async () => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ status: "closed" })
        .eq("id", conversationId);

      if (error) throw error;

      toast.success("A conversa foi encerrada com sucesso");

      // Agendar envio da pesquisa de satisfação
      try {
        const { data: settings } = await supabase
          .from('satisfaction_settings')
          .select('delay_minutes')
          .maybeSingle();

        if (settings && settings.delay_minutes > 0) {
          // Usar setTimeout para enviar após delay configurado
          setTimeout(async () => {
            await supabase.functions.invoke('send-satisfaction-survey', {
              body: { conversation_id: conversationId }
            });
          }, settings.delay_minutes * 60 * 1000);
        } else {
          // Enviar imediatamente
          await supabase.functions.invoke('send-satisfaction-survey', {
            body: { conversation_id: conversationId }
          });
        }
      } catch (error) {
        console.error('Erro ao enviar pesquisa:', error);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao encerrar conversa:", error);
      toast.error("Não foi possível encerrar a conversa");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar Conversa</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja encerrar esta conversa? Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleEndConversation}>
            Encerrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EndConversationDialog;
