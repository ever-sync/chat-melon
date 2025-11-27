import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ForwardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onSuccess: () => void;
};

const ForwardDialog = ({
  open,
  onOpenChange,
  conversationId,
  onSuccess,
}: ForwardDialogProps) => {
  const [flowName, setFlowName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForward = async () => {
    if (!flowName.trim()) {
      toast.error("Digite o nome do fluxo");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Conversa encaminhada para o fluxo "${flowName}"`);

      onSuccess();
      onOpenChange(false);
      setFlowName("");
    } catch (error) {
      console.error("Erro ao encaminhar conversa:", error);
      toast.error("Não foi possível encaminhar a conversa");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encaminhar para Fluxo</DialogTitle>
          <DialogDescription>
            Encaminhe esta conversa para um fluxo de automação ou chatbot
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flow-name">Nome do Fluxo</Label>
            <Input
              id="flow-name"
              placeholder="Ex: Atendimento Automatizado"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleForward} disabled={isLoading}>
            {isLoading ? "Encaminhando..." : "Encaminhar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardDialog;
