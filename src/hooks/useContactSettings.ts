import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export interface ContactSettings {
    id: string;
    company_id: string;
    entity_name: string;
    entity_name_plural: string;
    entity_icon: string;
}

export function useContactSettings() {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ["contact-settings", currentCompany?.id],
        queryFn: async () => {
            if (!currentCompany?.id) return null;

            const { data, error } = await supabase
                .from("contact_settings")
                .select("*")
                .eq("company_id", currentCompany.id)
                .maybeSingle();

            if (error) throw error;

            // Return default values if no settings found
            if (!data) {
                return {
                    entity_name: "Contato",
                    entity_name_plural: "Contatos",
                    entity_icon: "User"
                } as ContactSettings;
            }

            return data as ContactSettings;
        },
        enabled: !!currentCompany?.id,
    });

    const updateSettings = useMutation({
        mutationFn: async (newSettings: Partial<ContactSettings>) => {
            if (!currentCompany?.id) throw new Error("No company selected");

            // Check if settings exist
            const { data: existing } = await supabase
                .from("contact_settings")
                .select("id")
                .eq("company_id", currentCompany.id)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from("contact_settings")
                    .update(newSettings)
                    .eq("id", existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("contact_settings")
                    .insert({
                        company_id: currentCompany.id,
                        ...newSettings
                    });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-settings"] });
            toast.success("Configurações atualizadas!");
        },
        onError: (error) => {
            console.error("Error updating settings:", error);
            toast.error("Erro ao atualizar configurações");
        },
    });

    return {
        settings,
        isLoading,
        updateSettings,
    };
}
