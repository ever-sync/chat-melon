import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./useCompanyQuery";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useScoringRules = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["scoring-rules", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("scoring_rules")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createRule = useMutation({
    mutationFn: async (rule: TablesInsert<"scoring_rules">) => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .insert({
          ...rule,
          company_id: companyId!,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
      toast.success("Regra criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar regra:", error);
      toast.error("Erro ao criar regra");
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...rule }: TablesUpdate<"scoring_rules"> & { id: string }) => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .update(rule)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
      toast.success("Regra atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar regra:", error);
      toast.error("Erro ao atualizar regra");
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from("scoring_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules"] });
      toast.success("Regra excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir regra:", error);
      toast.error("Erro ao excluir regra");
    },
  });

  const calculateLeadScore = async (contactId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-lead-score', {
        body: { contactId }
      });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      return data;
    } catch (error) {
      console.error("Erro ao calcular score:", error);
      throw error;
    }
  };

  return {
    rules,
    isLoading,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    calculateLeadScore,
  };
};