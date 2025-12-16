import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./crm/useCompanyQuery";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Template = Tables<"message_templates"> & {
  creator: Tables<"profiles"> | null;
};

interface TemplateFilters {
  category?: string;
  isFavorite?: boolean;
  search?: string;
}

export const useTemplates = (filters?: TemplateFilters) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from("message_templates")
        .select(`
          *,
          creator:profiles!message_templates_created_by_fkey (*)
        `)
        .eq("company_id", companyId)
        .order("is_favorite", { ascending: false })
        .order("usage_count", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.isFavorite) {
        query = query.eq("is_favorite", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      let result = data as Template[];

      // Client-side search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(searchLower) ||
            t.content.toLowerCase().includes(searchLower)
        );
      }

      return result;
    },
    enabled: !!companyId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: TablesInsert<"message_templates">) => {
      if (!companyId) throw new Error("No company selected");

      const { data: user } = await supabase.auth.getUser();

      // Extract variables from content
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(template.content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }

      const { data, error } = await supabase
        .from("message_templates")
        .insert({
          ...template,
          company_id: companyId,
          created_by: user.user?.id,
          variables,
        })
        .select(`
          *,
          creator:profiles!message_templates_created_by_fkey (*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"message_templates"> & { id: string }) => {
      // Extract variables if content changed
      let variables = undefined;
      if (updates.content) {
        const variableRegex = /\{\{(\w+)\}\}/g;
        variables = [];
        let match;
        while ((match = variableRegex.exec(updates.content)) !== null) {
          if (!variables.includes(match[1])) {
            variables.push(match[1]);
          }
        }
      }

      const { data, error } = await supabase
        .from("message_templates")
        .update({ ...updates, variables })
        .eq("id", id)
        .select(`
          *,
          creator:profiles!message_templates_created_by_fkey (*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar template: " + error.message);
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { data, error } = await supabase
        .from("message_templates")
        .update({ is_favorite: !isFavorite })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) => {
      toast.error("Erro ao favoritar template: " + error.message);
    },
  });

  const incrementUsage = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      const { error } = await supabase
        .from("message_templates")
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir template: " + error.message);
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    toggleFavorite,
    incrementUsage,
    deleteTemplate,
  };
};
