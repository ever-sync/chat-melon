import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export interface ContactCategory {
    id: string;
    name: string;
    color: string;
    company_id: string;
}

export function useContactCategories() {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["contact-categories", currentCompany?.id],
        queryFn: async () => {
            if (!currentCompany?.id) return [];

            const { data, error } = await supabase
                .from("contact_categories")
                .select("*")
                .eq("company_id", currentCompany.id)
                .order("name");

            if (error) throw error;
            return data as ContactCategory[];
        },
        enabled: !!currentCompany?.id,
    });

    const createCategory = useMutation({
        mutationFn: async (category: { name: string; color: string }) => {
            if (!currentCompany?.id) throw new Error("No company selected");

            const { error } = await supabase
                .from("contact_categories")
                .insert({
                    company_id: currentCompany.id,
                    name: category.name,
                    color: category.color,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-categories"] });
            toast.success("Categoria criada com sucesso!");
        },
        onError: (error) => {
            toast.error("Erro ao criar categoria: " + error.message);
        },
    });

    const updateCategory = useMutation({
        mutationFn: async ({ id, ...data }: { id: string; name?: string; color?: string }) => {
            const { error } = await supabase
                .from("contact_categories")
                .update(data)
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-categories"] });
            toast.success("Categoria atualizada!");
        },
        onError: (error) => {
            toast.error("Erro ao atualizar categoria: " + error.message);
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("contact_categories")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-categories"] });
            toast.success("Categoria removida!");
        },
        onError: (error) => {
            toast.error("Erro ao remover categoria: " + error.message);
        },
    });

    return {
        categories,
        isLoading,
        createCategory,
        updateCategory,
        deleteCategory,
    };
}
