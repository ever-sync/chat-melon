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
import type { Task } from "@/hooks/crm/useTasks";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSubmit: (data: TablesInsert<"tasks">) => Promise<Task>;
  defaultDealId?: string; // Pre-select a deal (for use in DealTasksSection)
}

export const TaskModal = ({
  open,
  onOpenChange,
  task,
  onSubmit,
  defaultDealId,
}: TaskModalProps) => {
  const { companyId } = useCompanyQuery();
  const { connectionStatus, createCalendarEvent } = useGoogleCalendar();
  const [addToCalendar, setAddToCalendar] = useState(false);
  const { register, handleSubmit, setValue, watch, reset } = useForm<TablesInsert<"tasks">>();

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

  const { data: deals = [] } = useQuery({
    queryKey: ["deals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("deals")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "open")
        .order("title");
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data || [];
    },
  });

  useEffect(() => {
    if (task) {
      setValue("title", task.title);
      setValue("description", task.description);
      setValue("task_type", task.task_type);
      setValue("priority", task.priority);
      setValue("due_date", task.due_date);
      setValue("assigned_to", task.assigned_to);
      setValue("contact_id", task.contact_id);
      setValue("deal_id", task.deal_id);
    } else {
      // Set defaults for new task
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setValue("due_date", tomorrow.toISOString().slice(0, 16));
      setValue("priority", "medium");
      setValue("task_type", "follow_up");

      // Pre-select deal if provided
      if (defaultDealId) {
        setValue("deal_id", defaultDealId);
      }
    }
  }, [task, setValue, defaultDealId]);

  const handleFormSubmit = async (data: TablesInsert<"tasks">) => {
    // Cria a tarefa primeiro
    const taskData = await onSubmit(data);
    
    // Se marcou para adicionar ao Calendar e é meeting/call
    if (addToCalendar && (data.task_type === 'meeting' || data.task_type === 'call') && taskData?.id && companyId) {
      createCalendarEvent.mutate({ taskId: taskData.id, companyId });
    }
    
    reset();
    setAddToCalendar(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Ex: Ligar para cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task_type">Tipo</Label>
              <Select
                value={watch("task_type") || "follow_up"}
                onValueChange={(value) => setValue("task_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Ligação</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="proposal">Proposta</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="due_date">Data/Hora de Vencimento *</Label>
            <Input
              id="due_date"
              type="datetime-local"
              {...register("due_date", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Responsável *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="contact_id">Contato (Opcional)</Label>
            <Select
              value={watch("contact_id") || "none"}
              onValueChange={(value) => setValue("contact_id", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name || contact.phone_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal_id">Negócio (Opcional)</Label>
            <Select
              value={watch("deal_id") || "none"}
              onValueChange={(value) => setValue("deal_id", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um negócio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Google Calendar Integration */}
          {connectionStatus?.connected && (watch("task_type") === "meeting" || watch("task_type") === "call") && (
            <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <Checkbox
                id="add-to-calendar"
                checked={addToCalendar}
                onCheckedChange={(checked) => setAddToCalendar(checked as boolean)}
              />
              <label
                htmlFor="add-to-calendar"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Adicionar ao Google Calendar
                {addToCalendar && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Link do Meet será gerado automaticamente)
                  </span>
                )}
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{task ? "Atualizar" : "Criar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};