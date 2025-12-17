import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "@/hooks/crm/useCompanyQuery";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import type { Deal } from "@/hooks/crm/useDeals";
import type { TablesInsert } from "@/integrations/supabase/types";

interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
  stageId?: string;
  pipelineId?: string;
  defaultContactId?: string;
  onSubmit: (data: TablesInsert<"deals">) => void;
}

export const DealModal = ({
  open,
  onOpenChange,
  deal,
  stageId,
  pipelineId,
  defaultContactId,
  onSubmit,
}: DealModalProps) => {
  const { companyId } = useCompanyQuery();
  const { register, handleSubmit, setValue, watch, reset } = useForm<TablesInsert<"deals">>();


  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages", pipelineId],
    queryFn: async () => {
      if (!pipelineId) return [];
      const { data } = await supabase
        .from("pipeline_stages")
        .select("*")
        .eq("pipeline_id", pipelineId)
        .order("order_index");
      return data || [];
    },
    enabled: !!pipelineId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("profiles")
        .select("*");
      return data || [];
    },
  });

  useEffect(() => {
    if (deal) {
      setValue("title", deal.title);
      setValue("contact_id", deal.contact_id);
      setValue("value", deal.value);
      setValue("expected_close_date", deal.expected_close_date);
      setValue("probability", deal.probability);
      setValue("priority", deal.priority);
      setValue("assigned_to", deal.assigned_to);
      setValue("stage_id", deal.stage_id);
      setValue("temperature", deal.temperature);
      setValue("budget_confirmed", deal.budget_confirmed);
      setValue("timeline_confirmed", deal.timeline_confirmed);
      setValue("decision_maker", deal.decision_maker);
      setValue("need_identified", deal.need_identified);
      setValue("competitor", deal.competitor);
      setValue("competitor_strengths", deal.competitor_strengths);
      setValue("our_differentials", deal.our_differentials);
      setValue("next_step", deal.next_step);
      setValue("next_step_date", deal.next_step_date);
    } else {
      // Pre-fill for new deal
      if (stageId) {
        setValue("stage_id", stageId);
      }
      if (defaultContactId) {
        setValue("contact_id", defaultContactId);
      }
    }
    if (pipelineId && !deal) {
      setValue("pipeline_id", pipelineId);
    }
  }, [deal, stageId, pipelineId, defaultContactId, setValue]);


  const budgetConfirmed = watch("budget_confirmed");
  const timelineConfirmed = watch("timeline_confirmed");
  const hasDecisionMaker = !!watch("decision_maker");
  const hasNeed = !!watch("need_identified");

  const bantProgress = [
    budgetConfirmed,
    hasDecisionMaker,
    hasNeed,
    timelineConfirmed
  ].filter(Boolean).length * 25;

  const handleFormSubmit = (data: TablesInsert<"deals">) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? "Editar Negócio" : "Novo Negócio"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="qualificacao">Qualificação</TabsTrigger>
              <TabsTrigger value="competicao">Competição</TabsTrigger>
              <TabsTrigger value="proximos">Próximos Passos</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  {...register("title", { required: true })}
                  placeholder="Ex: Proposta para Cliente X"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_id">Contato *</Label>
                <Select
                  value={watch("contact_id") || ""}
                  onValueChange={(value) => setValue("contact_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name || contact.phone_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    {...register("value", { valueAsNumber: true })}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_close_date">Previsão de Fechamento</Label>
                  <Input
                    id="expected_close_date"
                    type="date"
                    {...register("expected_close_date")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="probability">Probabilidade (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    {...register("probability", { valueAsNumber: true })}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={watch("priority") || "medium"}
                    onValueChange={(value) => setValue("priority", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage_id">Etapa *</Label>
                  <Select
                    value={watch("stage_id") || ""}
                    onValueChange={(value) => setValue("stage_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Responsável</Label>
                  <Select
                    value={watch("assigned_to") || ""}
                    onValueChange={(value) => setValue("assigned_to", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura</Label>
                <Select
                  value={watch("temperature") || "warm"}
                  onValueChange={(value) => setValue("temperature", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">🔥 Quente</SelectItem>
                    <SelectItem value="warm">🌡️ Morno</SelectItem>
                    <SelectItem value="cold">❄️ Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="qualificacao" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="budget_confirmed">Budget - Orçamento Confirmado</Label>
                    <p className="text-sm text-muted-foreground">O cliente confirmou ter orçamento?</p>
                  </div>
                  <Switch
                    id="budget_confirmed"
                    checked={watch("budget_confirmed")}
                    onCheckedChange={(checked) => setValue("budget_confirmed", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decision_maker">Authority - Decisor</Label>
                  <Input
                    id="decision_maker"
                    {...register("decision_maker")}
                    placeholder="Nome do decisor principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="need_identified">Need - Necessidade Identificada</Label>
                  <Textarea
                    id="need_identified"
                    {...register("need_identified")}
                    placeholder="Descreva a necessidade principal do cliente..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="timeline_confirmed">Timeline - Prazo Confirmado</Label>
                    <p className="text-sm text-muted-foreground">O cliente confirmou o prazo de decisão?</p>
                  </div>
                  <Switch
                    id="timeline_confirmed"
                    checked={watch("timeline_confirmed")}
                    onCheckedChange={(checked) => setValue("timeline_confirmed", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Progresso BANT</Label>
                    <span className="text-sm font-medium">{bantProgress}%</span>
                  </div>
                  <Progress value={bantProgress} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="competicao" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="competitor">Concorrente Principal</Label>
                <Input
                  id="competitor"
                  {...register("competitor")}
                  placeholder="Nome do concorrente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitor_strengths">Pontos Fortes do Concorrente</Label>
                <Textarea
                  id="competitor_strengths"
                  {...register("competitor_strengths")}
                  placeholder="O que o concorrente faz bem..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="our_differentials">Nossos Diferenciais</Label>
                <Textarea
                  id="our_differentials"
                  {...register("our_differentials")}
                  placeholder="Por que somos melhores..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="proximos" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="next_step">Próximo Passo</Label>
                <Textarea
                  id="next_step"
                  {...register("next_step")}
                  placeholder="Descreva o próximo passo..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_step_date">Data do Próximo Passo</Label>
                <Input
                  id="next_step_date"
                  type="date"
                  {...register("next_step_date")}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const nextStep = watch("next_step");
                  const nextStepDate = watch("next_step_date");
                  const contactId = watch("contact_id");
                  const dealId = deal?.id;

                  if (!nextStep || !nextStepDate) {
                    toast.error("Preencha o próximo passo e a data para criar a tarefa");
                    return;
                  }

                  if (!contactId) {
                    toast.error("Selecione um contato antes de criar a tarefa");
                    return;
                  }

                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Usuário não autenticado");

                    const { error } = await supabase.from("tasks").insert({
                      company_id: companyId!,
                      title: nextStep,
                      description: `Tarefa criada automaticamente do negócio: ${watch("title") || "Novo negócio"}`,
                      task_type: "follow_up",
                      priority: "medium",
                      status: "pending",
                      due_date: nextStepDate,
                      assigned_to: watch("assigned_to") || user.id,
                      contact_id: contactId,
                      deal_id: dealId,
                      created_by: user.id,
                    });

                    if (error) throw error;
                    toast.success("Tarefa criada com sucesso!");
                  } catch (error) {
                    console.error("Erro ao criar tarefa:", error);
                    toast.error("Erro ao criar tarefa");
                  }
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Criar Tarefa Automaticamente
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {deal ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
