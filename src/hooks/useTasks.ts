import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./useCompanyQuery";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Task = Tables<"tasks"> & {
  contacts: Tables<"contacts"> | null;
  deals: Tables<"deals"> | null;
  profiles: Tables<"profiles"> | null;
  creator: Tables<"profiles"> | null;
};

interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useTasks = (filters?: TaskFilters) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from("tasks")
        .select(`
          *,
          contacts (*),
          deals (*),
          profiles!tasks_assigned_to_fkey (*),
          creator:profiles!tasks_created_by_fkey (*)
        `)
        .eq("company_id", companyId)
        .order("due_date", { ascending: true });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      if (filters?.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }

      if (filters?.dateFrom) {
        query = query.gte("due_date", filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte("due_date", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!companyId,
  });

  const overdueTasks = tasks.filter(
    (task) =>
      task.status === "pending" &&
      new Date(task.due_date) < new Date() &&
      !task.completed_at
  );

  const createTask = useMutation({
    mutationFn: async (task: TablesInsert<"tasks">) => {
      if (!companyId) throw new Error("No company selected");

      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...task,
          company_id: companyId,
          created_by: user.user?.id,
        })
        .select(`
          *,
          contacts (*),
          deals (*),
          profiles!tasks_assigned_to_fkey (*),
          creator:profiles!tasks_created_by_fkey (*)
        `)
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar tarefa: " + error.message);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"tasks"> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          contacts (*),
          deals (*),
          profiles!tasks_assigned_to_fkey (*),
          creator:profiles!tasks_created_by_fkey (*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    },
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select(`
          *,
          contacts (*),
          deals (*),
          profiles!tasks_assigned_to_fkey (*),
          creator:profiles!tasks_created_by_fkey (*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa concluída! ✅");
    },
    onError: (error) => {
      toast.error("Erro ao concluir tarefa: " + error.message);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir tarefa: " + error.message);
    },
  });

  return {
    tasks,
    overdueTasks,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  };
};
