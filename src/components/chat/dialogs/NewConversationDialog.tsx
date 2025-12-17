import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';

type NewConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NewConversationDialog = ({ open, onOpenChange }: NewConversationDialogProps) => {
  const { getCompanyId } = useCompanyQuery();
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactNumber.trim()) return;

    setIsCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Validate WhatsApp number first
      setIsValidating(true);
      const { data: validationData, error: validationError } = await supabase.functions.invoke(
        'evolution-validate-number',
        {
          body: { number: contactNumber },
        }
      );

      setIsValidating(false);

      if (validationError) {
        throw new Error('Erro ao validar número');
      }

      if (!validationData?.valid) {
        toast.error('Este número não está registrado no WhatsApp');
        return;
      }

      const { error } = await supabase.from('conversations').insert({
        user_id: user.id,
        company_id: getCompanyId(),
        contact_name: contactName,
        contact_number: validationData.number || contactNumber,
      });

      if (error) throw error;

      toast.success('Conversa criada com sucesso');

      setContactName('');
      setContactNumber('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a conversa');
    } finally {
      setIsCreating(false);
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>Adicione um novo contato para iniciar uma conversa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do contato</Label>
            <Input
              id="name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="João Silva"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Número do WhatsApp</Label>
            <Input
              id="number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+5511999999999"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isCreating || isValidating || !contactName.trim() || !contactNumber.trim()}
          >
            {isValidating ? 'Validando número...' : isCreating ? 'Criando...' : 'Criar Conversa'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
