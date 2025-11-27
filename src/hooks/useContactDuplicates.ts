import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "./useCompanyQuery";
import { toast } from "sonner";

export const useContactDuplicates = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: duplicates = [], isLoading } = useQuery({
    queryKey: ["contact-duplicates", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("contact_duplicates")
        .select(`
          *,
          contact_1:contacts!contact_duplicates_contact_id_1_fkey(*),
          contact_2:contacts!contact_duplicates_contact_id_2_fkey(*)
        `)
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const detectDuplicates = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Company ID não disponível");

      const { data, error } = await supabase.functions.invoke("detect-duplicates", {
        body: { company_id: companyId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contact-duplicates"] });
      toast.success(data.message || "Detecção concluída");
    },
    onError: (error: any) => {
      console.error("Erro ao detectar duplicados:", error);
      toast.error("Erro ao detectar duplicados");
    },
  });

  const mergeDuplicate = useMutation({
    mutationFn: async ({
      duplicateId,
      keepContactId,
      discardContactId,
      mergedData,
    }: {
      duplicateId: string;
      keepContactId: string;
      discardContactId: string;
      mergedData: any;
    }) => {
      if (!companyId) throw new Error("Company ID não disponível");

      // 1. Atualizar contato mantido com dados mesclados
      const { error: updateError } = await supabase
        .from("contacts")
        .update(mergedData)
        .eq("id", keepContactId);

      if (updateError) throw updateError;

      // 2. Mover conversas para contato mantido
      const { error: convError } = await supabase
        .from("conversations")
        .update({ contact_id: keepContactId })
        .eq("contact_id", discardContactId);

      if (convError) throw convError;

      // 3. Mover deals para contato mantido
      const { error: dealsError } = await supabase
        .from("deals")
        .update({ contact_id: keepContactId })
        .eq("contact_id", discardContactId);

      if (dealsError) throw dealsError;

      // 4. Mover tarefas para contato mantido
      const { error: tasksError } = await supabase
        .from("tasks")
        .update({ contact_id: keepContactId })
        .eq("contact_id", discardContactId);

      if (tasksError) throw tasksError;

      // 5. Mover notas para contato mantido
      const { error: notesError } = await supabase
        .from("contact_notes")
        .update({ contact_id: keepContactId })
        .eq("contact_id", discardContactId);

      if (notesError) throw notesError;

      // 6. Soft delete do contato descartado
      const { error: deleteError } = await supabase
        .from("contacts")
        .update({
          deleted_at: new Date().toISOString(),
          merged_into: keepContactId,
        })
        .eq("id", discardContactId);

      if (deleteError) throw deleteError;

      // 7. Marcar duplicado como mesclado
      const { error: dupError } = await supabase
        .from("contact_duplicates")
        .update({
          status: "merged",
          merged_into: keepContactId,
          merged_by: (await supabase.auth.getUser()).data.user?.id,
          merged_at: new Date().toISOString(),
        })
        .eq("id", duplicateId);

      if (dupError) throw dupError;

      return { keepContactId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-duplicates"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contatos mesclados com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao mesclar contatos:", error);
      toast.error("Erro ao mesclar contatos");
    },
  });

  const ignoreDuplicate = useMutation({
    mutationFn: async (duplicateId: string) => {
      const { error } = await supabase
        .from("contact_duplicates")
        .update({ status: "ignored" })
        .eq("id", duplicateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-duplicates"] });
      toast.success("Duplicado ignorado");
    },
    onError: (error: any) => {
      console.error("Erro ao ignorar duplicado:", error);
      toast.error("Erro ao ignorar duplicado");
    },
  });

  return {
    duplicates,
    isLoading,
    detectDuplicates: detectDuplicates.mutate,
    isDetecting: detectDuplicates.isPending,
    mergeDuplicate: mergeDuplicate.mutate,
    isMerging: mergeDuplicate.isPending,
    ignoreDuplicate: ignoreDuplicate.mutate,
  };
};