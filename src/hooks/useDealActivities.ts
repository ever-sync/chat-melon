import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DealActivity = Tables<"deal_activities"> & {
  profiles?: Tables<"profiles"> | null;
};

export type EmailActivity = {
  id: string;
  activity_type: "email_sent";
  created_at: string;
  description: string;
  metadata: {
    to_email: string;
    subject: string;
    status: string;
    opened_at?: string | null;
  };
  profiles?: Tables<"profiles"> | null;
};

export const useDealActivities = (dealId: string) => {
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["deal-activities", dealId],
    queryFn: async () => {
      // Buscar atividades normais
      const { data: dealActivities, error: activitiesError } = await supabase
        .from("deal_activities")
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (activitiesError) throw activitiesError;

      // Buscar emails enviados
      const { data: emailLogs, error: emailsError } = await supabase
        .from("email_logs")
        .select("*")
        .eq("deal_id", dealId)
        .order("sent_at", { ascending: false });

      if (emailsError) throw emailsError;

      // Converter emails para formato de atividade
      const emailActivities: EmailActivity[] = (emailLogs || []).map((log) => ({
        id: log.id,
        activity_type: "email_sent",
        created_at: log.sent_at,
        description: `Email enviado: ${log.subject}`,
        metadata: {
          to_email: log.to_email,
          subject: log.subject,
          status: log.status,
          opened_at: log.opened_at,
        },
        profiles: null,
      }));

      // Combinar e ordenar por data
      const combined = [...(dealActivities as DealActivity[]), ...emailActivities];
      combined.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

      return combined;
    },
    enabled: !!dealId,
  });

  const addActivity = useMutation({
    mutationFn: async (activity: TablesInsert<"deal_activities">) => {
      const { data, error } = await supabase
        .from("deal_activities")
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-activities", dealId] });
      toast.success("Atividade adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar atividade: " + error.message);
    },
  });

  return {
    activities,
    isLoading,
    addActivity,
  };
};
