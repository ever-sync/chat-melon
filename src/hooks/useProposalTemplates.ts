import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./crm/useCompanyQuery";
import { toast } from "sonner";

export interface TemplateSection {
  type: "header" | "text" | "products" | "pricing" | "terms" | "signature" | "image" | "divider";
  title?: string;
  subtitle?: string;
  content?: string;
  show_images?: boolean;
  show_discount?: boolean;
  image_url?: string;
}

export interface TemplateContent {
  sections: TemplateSection[];
  styles: {
    primaryColor: string;
    fontFamily: string;
  };
}

export interface ProposalTemplate {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  content: TemplateContent;
  thumbnail_url: string | null;
  category: string | null;
  is_default: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useProposalTemplates = (category?: string) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["proposal-templates", companyId, category],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from("proposal_templates")
        .select("*")
        .eq("company_id", companyId)
        .order("is_default", { ascending: false })
        .order("usage_count", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        content: t.content as unknown as TemplateContent,
      })) as ProposalTemplate[];
    },
    enabled: !!companyId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Partial<ProposalTemplate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      if (!companyId) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("proposal_templates")
        .insert({
          company_id: companyId,
          name: template.name,
          description: template.description,
          content: template.content as any,
          thumbnail_url: template.thumbnail_url,
          category: template.category,
          is_default: template.is_default || false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar template");
      console.error(error);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProposalTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("proposal_templates")
        .update({
          name: updates.name,
          description: updates.description,
          content: updates.content as any,
          thumbnail_url: updates.thumbnail_url,
          category: updates.category,
          is_default: updates.is_default,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success("Template atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar template");
      console.error(error);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proposal_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
      toast.success("Template excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir template");
      console.error(error);
    },
  });

  const incrementUsage = useMutation({
    mutationFn: async (id: string) => {
      const template = templates.find(t => t.id === id);
      if (template) {
        await supabase
          .from("proposal_templates")
          .update({ usage_count: template.usage_count + 1 })
          .eq("id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
    incrementUsage: incrementUsage.mutateAsync,
  };
};
