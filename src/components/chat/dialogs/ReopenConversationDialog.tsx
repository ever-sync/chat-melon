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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ReopenConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onSuccess: () => void;
};

const ReopenConversationDialog = ({
  open,
  onOpenChange,
  conversationId,
  onSuccess,
}: ReopenConversationDialogProps) => {
  const handleReopenConversation = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'active',
          unread_count: 0,
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast.success('A conversa foi reaberta e está ativa novamente');

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao reabrir conversa:', error);
      toast.error('Não foi possível reabrir a conversa');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reabrir Conversa</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja reabrir esta conversa? Ela ficará ativa novamente e você poderá continuar a
            atendimento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReopenConversation}>Reabrir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReopenConversationDialog;
