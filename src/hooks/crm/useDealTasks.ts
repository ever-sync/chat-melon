import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export type DealTaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type DealTaskPriority = "low" | "medium" | "high" | "urgent";

export type DealTask = {
  id: string;
  deal_id: string;
  company_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  priority: DealTaskPriority;
  status: DealTaskStatus;
  completed_at: string | null;
  completed_by: string | null;
  reminder_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  assigned_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  creator_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type CreateDealTaskInput = {
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: DealTaskPriority;
  reminder_at?: string;
};

export type UpdateDealTaskInput = {
  title?: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: DealTaskPriority;
  status?: DealTaskStatus;
  reminder_at?: string;
};

export const useDealTasks = (dealId?: string) => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  // Query para buscar tarefas
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["deal-tasks", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data, error } = await supabase
        .from("deal_tasks")
        .select(`
          *,
          assigned_profile:profiles!deal_tasks_assigned_to_fkey (
            id,
            full_name,
            avatar_url
          ),
          creator_profile:profiles!deal_tasks_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("deal_id", dealId)
        .order("status", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as DealTask[];
    },
    enabled: !!dealId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Tarefas pendentes
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const overdueTasks = tasks.filter(t =>
    t.status !== "completed" &&
    t.due_date &&
    new Date(t.due_date) < new Date()
  );

  // Mutation para criar tarefa
  const createTask = useMutation({
    mutationFn: async (input: CreateDealTaskInput) => {
      if (!dealId || !currentCompany?.id) {
        throw new Error("Deal ID ou Company ID não disponível");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("deal_tasks")
        .insert({
          deal_id: dealId,
          company_id: currentCompany.id,
          created_by: user.id,
          title: input.title,
          description: input.description,
          assigned_to: input.assigned_to,
          due_date: input.due_date,
          priority: input.priority || "medium",
          reminder_at: input.reminder_at,
        })
        .select(`
          *,
          assigned_profile:profiles!deal_tasks_assigned_to_fkey (
            id,
            full_name,
            avatar_url
          ),
          creator_profile:profiles!deal_tasks_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-tasks", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-activities", dealId] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar tarefa: " + error.message);
    },
  });

  // Mutation para atualizar tarefa
  const updateTask = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: UpdateDealTaskInput }) => {
      const { data, error } = await supabase
        .from("deal_tasks")
        .update(updates)
        .eq("id", taskId)
        .select(`
          *,
          assigned_profile:profiles!deal_tasks_assigned_to_fkey (
            id,
            full_name,
            avatar_url
          ),
          creator_profile:profiles!deal_tasks_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-tasks", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-activities", dealId] });
      toast.success("Tarefa atualizada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    },
  });

  // Mutation para completar tarefa
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from("deal_tasks")
        .update({ status: "completed" })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-tasks", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-activities", dealId] });
      toast.success("Tarefa concluída!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao concluir tarefa: " + error.message);
    },
  });

  // Mutation para reabrir tarefa
  const reopenTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from("deal_tasks")
        .update({ status: "pending" })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-tasks", dealId] });
      toast.success("Tarefa reaberta!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao reabrir tarefa: " + error.message);
    },
  });

  // Mutation para deletar tarefa
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("deal_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-tasks", dealId] });
      toast.success("Tarefa excluída!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir tarefa: " + error.message);
    },
  });

  return {
    tasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    reopenTask,
    deleteTask,
  };
};
