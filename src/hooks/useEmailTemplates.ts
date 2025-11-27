import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./useCompanyQuery";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  company_id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  template_id: string | null;
  subject: string;
  body: string;
  to_email: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  sent_at: string;
  error_message: string | null;
  metadata: any;
}

export const useEmailTemplates = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!companyId,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      if (!companyId) throw new Error("Company ID não encontrado");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Extrair variáveis do corpo
      const variables = extractVariables(template.body || "");

      const { data, error } = await supabase
        .from("email_templates")
        .insert([{
          name: template.name!,
          subject: template.subject!,
          body: template.body!,
          category: template.category || null,
          company_id: companyId,
          created_by: user.id,
          variables,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const variables = updates.body ? extractVariables(updates.body) : undefined;

      const { data, error } = await supabase
        .from("email_templates")
        .update({
          ...updates,
          variables,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template atualizado!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template excluído!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir template: ${error.message}`);
    },
  });

  const sendEmail = useMutation({
    mutationFn: async (params: {
      to_email: string;
      subject: string;
      body: string;
      contact_id?: string;
      deal_id?: string;
      template_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          ...params,
          company_id: companyId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      toast.success("Email enviado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar email: ${error.message}`);
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    sendEmail,
  };
};

export const useEmailLogs = (dealId?: string, contactId?: string) => {
  const { companyId } = useCompanyQuery();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email-logs", companyId, dealId, contactId],
    queryFn: async () => {
      if (!companyId) return [];
      
      let query = supabase
        .from("email_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("sent_at", { ascending: false });

      if (dealId) {
        query = query.eq("deal_id", dealId);
      }

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!companyId,
  });

  return {
    logs,
    isLoading,
  };
};

// Helper para extrair variáveis do template
function extractVariables(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = text.match(regex) || [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
}