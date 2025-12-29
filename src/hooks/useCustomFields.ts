import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './crm/useCompanyQuery';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CustomField = {
  id: string;
  company_id: string;
  entity_type: 'contact' | 'deal' | 'company';
  field_name: string;
  field_label: string;
  field_type:
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'cpf'
  | 'cnpj'
  | 'cep'
  | 'textarea';
  options?: string[];
  is_required: boolean;
  default_value?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomFieldValue = {
  id: string;
  custom_field_id: string;
  entity_id: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export const useCustomFields = (entityType: 'contact' | 'deal' | 'company') => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['custom_fields', companyId, entityType],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('company_id', companyId)
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as CustomField[];
    },
    enabled: !!companyId,
  });

  const createField = useMutation({
    mutationFn: async (field: Omit<TablesInsert<'custom_fields'>, 'company_id' | 'entity_type'>) => {
      const { data, error } = await supabase
        .from('custom_fields')
        .insert({
          ...field,
          company_id: companyId!,
          entity_type: entityType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields'] });
      toast.success('Campo criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar campo:', error);
      toast.error('Erro ao criar campo');
    },
  });

  const updateField = useMutation({
    mutationFn: async ({ id, ...field }: TablesUpdate<'custom_fields'> & { id: string }) => {
      const { data, error } = await supabase
        .from('custom_fields')
        .update(field)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields'] });
      toast.success('Campo atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar campo:', error);
      toast.error('Erro ao atualizar campo');
    },
  });

  const reorderFields = useMutation({
    mutationFn: async (fields: { id: string; display_order: number }[]) => {
      const updates = fields.map(({ id, display_order }) =>
        supabase.from('custom_fields').update({ display_order }).eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields'] });
    },
  });

  const deleteField = useMutation({
    mutationFn: async (fieldId: string) => {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_fields'] });
      toast.success('Campo excluído permanentemente!');
    },
    onError: (error) => {
      console.error('Erro ao excluir campo:', error);
      toast.error('Erro ao excluir campo');
    },
  });

  return {
    fields,
    isLoading,
    createField,
    updateField,
    reorderFields,
    deleteField,
  };
};

export const useCustomFieldValues = (entityId?: string) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: values = [], isLoading } = useQuery({
    queryKey: ['custom_field_values', entityId],
    queryFn: async () => {
      if (!entityId) return [];

      const { data, error } = await supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_id', entityId);

      if (error) throw error;
      return data as CustomFieldValue[];
    },
    enabled: !!entityId,
  });

  const saveValue = useMutation({
    mutationFn: async ({
      fieldId,
      entityId,
      value,
    }: {
      fieldId: string;
      entityId: string;
      value: string;
    }) => {
      const { data, error } = await supabase
        .from('custom_field_values')
        .upsert({
          custom_field_id: fieldId,
          entity_id: entityId,
          value,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_field_values'] });
    },
  });

  return {
    values,
    isLoading,
    saveValue: saveValue.mutate,
  };
};
