import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./crm/useCompanyQuery";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export interface SegmentFilter {
  field: string;
  operator: string;
  value: any;
  logic?: 'AND' | 'OR';
}

export const useSegments = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["segments", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("segments")
        .select("*")
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const createSegment = useMutation({
    mutationFn: async (segment: TablesInsert<"segments">) => {
      const { data, error } = await supabase
        .from("segments")
        .insert({
          ...segment,
          company_id: companyId!,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Segmento criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar segmento:", error);
      toast.error("Erro ao criar segmento");
    },
  });

  const updateSegment = useMutation({
    mutationFn: async ({ id, ...segment }: TablesUpdate<"segments"> & { id: string }) => {
      const { data, error } = await supabase
        .from("segments")
        .update(segment)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Segmento atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar segmento:", error);
      toast.error("Erro ao atualizar segmento");
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase
        .from("segments")
        .delete()
        .eq("id", segmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Segmento excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir segmento:", error);
      toast.error("Erro ao excluir segmento");
    },
  });

  const previewSegment = async (filters: SegmentFilter[]): Promise<{ count: number; contacts: any[] }> => {
    if (!companyId || filters.length === 0) return { count: 0, contacts: [] };

    try {
      const baseQuery: any = supabase
        .from("contacts")
        .select("*", { count: "exact" })
        .eq("company_id", companyId)
        .is("deleted_at", null);

      // Aplicar filtros
      let query = baseQuery;
      filters.forEach((filter) => {
        const { field, operator, value } = filter;

        switch (operator) {
          case "equals":
            query = query.eq(field, value);
            break;
          case "not_equals":
            query = query.neq(field, value);
            break;
          case "contains":
            query = query.ilike(field, `%${value}%`);
            break;
          case "starts_with":
            query = query.ilike(field, `${value}%`);
            break;
          case "ends_with":
            query = query.ilike(field, `%${value}`);
            break;
          case "is_empty":
            query = query.is(field, null);
            break;
          case "is_not_empty":
            query = query.not(field, "is", null);
            break;
          case "greater_than":
            query = query.gt(field, value);
            break;
          case "less_than":
            query = query.lt(field, value);
            break;
          case "before":
            query = query.lt(field, value);
            break;
          case "after":
            query = query.gt(field, value);
            break;
        }
      });

      const result = await query.limit(10);

      if (result.error) throw result.error;

      return {
        count: result.count || 0,
        contacts: result.data || [],
      };
    } catch (error) {
      console.error("Erro ao fazer preview do segmento:", error);
      return { count: 0, contacts: [] };
    }
  };

  return {
    segments,
    isLoading,
    createSegment: createSegment.mutate,
    updateSegment: updateSegment.mutate,
    deleteSegment: deleteSegment.mutate,
    previewSegment,
  };
};
