import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProposalVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (changeNotes: string) => void;
  proposalTitle: string;
}

export const ProposalVersionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  proposalTitle,
}: ProposalVersionDialogProps) => {
  const [changeNotes, setChangeNotes] = useState("");

  const handleConfirm = () => {
    if (!changeNotes.trim()) return;
    onConfirm(changeNotes);
    setChangeNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Versão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Você está criando uma nova versão de: <strong>{proposalTitle}</strong>
          </p>
          
          <div>
            <Label htmlFor="change-notes">
              Descreva as alterações desta versão *
            </Label>
            <Textarea
              id="change-notes"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="Ex: Ajustado desconto para 15%, adicionado serviço de suporte..."
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!changeNotes.trim()}>
            Criar Versão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
