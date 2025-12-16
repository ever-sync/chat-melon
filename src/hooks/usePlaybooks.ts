import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./crm/useCompanyQuery";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Playbook = Tables<"playbooks">;
export type PlaybookExecution = Tables<"playbook_executions"> & {
  playbooks?: Pick<Playbook, "name">;
  deals?: { title: string; contacts: { name: string | null } };
};

export type PlaybookStep = {
  id: string;
  type: "send_whatsapp" | "create_task" | "move_stage" | "wait" | "webhook" | "notify_user";
  config: {
    message?: string;
    title?: string;
    task_type?: string;
    priority?: string;
    due_in_days?: number;
    assign_to?: string;
    target_stage?: string;
    wait_days?: number;
    url?: string;
    method?: string;
    user_id?: string;
  };
};

export const usePlaybooks = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: ["playbooks", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("playbooks")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createPlaybook = useMutation({
    mutationFn: async (playbook: TablesInsert<"playbooks">) => {
      if (!companyId) throw new Error("Company ID not found");

      const { data, error } = await supabase
        .from("playbooks")
        .insert({ ...playbook, company_id: companyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbooks", companyId] });
      toast.success("Playbook criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating playbook:", error);
      toast.error("Erro ao criar playbook");
    },
  });

  const updatePlaybook = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"playbooks">;
    }) => {
      const { data, error } = await supabase
        .from("playbooks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbooks", companyId] });
      toast.success("Playbook atualizado!");
    },
    onError: (error) => {
      console.error("Error updating playbook:", error);
      toast.error("Erro ao atualizar playbook");
    },
  });

  const deletePlaybook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("playbooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbooks", companyId] });
      toast.success("Playbook excluído!");
    },
    onError: (error) => {
      console.error("Error deleting playbook:", error);
      toast.error("Erro ao excluir playbook");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("playbooks")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbooks", companyId] });
      toast.success("Status atualizado!");
    },
  });

  return {
    playbooks,
    isLoading,
    createPlaybook,
    updatePlaybook,
    deletePlaybook,
    toggleActive,
  };
};

export const usePlaybookExecutions = (playbookId?: string) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ["playbook-executions", companyId, playbookId],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from("playbook_executions")
        .select(`
          *,
          playbooks!inner(name, company_id),
          deals(title, contacts(name))
        `)
        .eq("playbooks.company_id", companyId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (playbookId) {
        query = query.eq("playbook_id", playbookId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PlaybookExecution[];
    },
    enabled: !!companyId,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["playbook-executions", companyId, playbookId] });
  };

  return {
    executions,
    isLoading,
    refetch,
  };
};
