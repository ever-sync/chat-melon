import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import type { Template } from "@/hooks/useTemplates";
import type { TablesInsert } from "@/integrations/supabase/types";

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template;
  onSubmit: (data: TablesInsert<"message_templates">) => void;
}

export const TemplateModal = ({
  open,
  onOpenChange,
  template,
  onSubmit,
}: TemplateModalProps) => {
  const { register, handleSubmit, setValue, watch, reset } = useForm<
    TablesInsert<"message_templates">
  >();

  const content = watch("content") || "";

  // Extract variables from content
  const extractedVars = content.match(/\{\{(\w+)\}\}/g) || [];
  const uniqueVars = [...new Set(extractedVars)];

  useEffect(() => {
    if (template) {
      setValue("name", template.name);
      setValue("content", template.content);
      setValue("category", template.category);
    } else {
      reset();
    }
  }, [template, setValue, reset]);

  const handleFormSubmit = (data: TablesInsert<"message_templates">) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Template" : "Novo Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Template *</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="Ex: Boas-vindas, Follow-up, Proposta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={watch("category") || "all"}
              onValueChange={(value) => setValue("category", value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Nenhuma</SelectItem>
                <SelectItem value="boas-vindas">Boas-vindas</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="agradecimento">Agradecimento</SelectItem>
                <SelectItem value="objecao">Objeção</SelectItem>
                <SelectItem value="fechamento">Fechamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Mensagem *</Label>
            <Textarea
              id="content"
              {...register("content", { required: true })}
              placeholder="Digite a mensagem... Use {{variavel}} para criar variáveis dinâmicas"
              rows={6}
            />
            
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md text-sm">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  Use variáveis dinâmicas como: <code className="bg-background px-1 rounded">{"{{nome}}"}</code>, <code className="bg-background px-1 rounded">{"{{empresa}}"}</code>, <code className="bg-background px-1 rounded">{"{{produto}}"}</code>
                </p>
                {uniqueVars.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    <span className="text-xs font-medium">Variáveis detectadas:</span>
                    {uniqueVars.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">
                        {v}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{template ? "Atualizar" : "Criar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
