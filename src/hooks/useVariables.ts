import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './crm/useCompanyQuery';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CompanyVariable = {
    id: string;
    company_id: string;
    key: string;
    label: string;
    value: string;
    description?: string;
    created_at: string;
    updated_at: string;
};

export const useVariables = () => {
    const { companyId } = useCompanyQuery();
    const queryClient = useQueryClient();

    const { data: variables = [], isLoading } = useQuery({
        queryKey: ['company_variables', companyId],
        queryFn: async () => {
            if (!companyId) return [];

            const { data, error } = await supabase
                .from('company_variables' as any)
                .select('*')
                .eq('company_id', companyId)
                .order('key');

            if (error) throw error;
            return (data as unknown) as CompanyVariable[];
        },
        enabled: !!companyId,
    });

    const createVariable = useMutation({
        mutationFn: async (variable: Omit<CompanyVariable, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('company_variables' as any)
                .insert({
                    ...variable,
                    company_id: companyId!,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company_variables'] });
            toast.success('Variável criada com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao criar variável:', error);
            toast.error('Erro ao criar variável');
        },
    });

    const updateVariable = useMutation({
        mutationFn: async ({ id, ...variable }: Partial<CompanyVariable> & { id: string }) => {
            const { data, error } = await supabase
                .from('company_variables' as any)
                .update(variable)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company_variables'] });
            toast.success('Variável atualizada!');
        },
        onError: (error) => {
            console.error('Erro ao atualizar variável:', error);
            toast.error('Erro ao atualizar variável');
        },
    });

    const deleteVariable = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('company_variables' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company_variables'] });
            toast.success('Variável removida!');
        },
        onError: (error) => {
            console.error('Erro ao remover variável:', error);
            toast.error('Erro ao remover variável');
        },
    });

    return {
        variables,
        isLoading,
        createVariable: createVariable.mutate,
        updateVariable: updateVariable.mutate,
        deleteVariable: deleteVariable.mutate,
        isCreating: createVariable.isPending,
        isUpdating: updateVariable.isPending,
        isDeleting: deleteVariable.isPending,
    };
};
