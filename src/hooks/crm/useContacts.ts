import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export const useContacts = (segmentId?: string) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', companyId, segmentId],
    queryFn: async () => {
      if (!companyId) return [];

      // Sem filtro de segmento, buscar todos
      if (!segmentId) {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('name');

        if (error) throw error;
        return data;
      }

      // Com filtro de segmento
      const { data: segment } = await supabase
        .from('segments')
        .select('filters')
        .eq('id', segmentId)
        .single();

      // Se segmento não tem filtros, retornar todos
      if (!segment?.filters || !Array.isArray(segment.filters)) {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('name');

        if (error) throw error;
        return data;
      }

      // Buscar todos os contatos e filtrar manualmente
      const { data: allContacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      if (!allContacts) return [];

      // Aplicar filtros manualmente
      const filters = segment.filters as any[];
      const filteredContacts = allContacts.filter((contact) => {
        return filters.every((filter: any) => {
          const { field, operator, value } = filter;
          const fieldValue = (contact as any)[field];

          switch (operator) {
            case 'equals':
              return fieldValue === value;
            case 'not_equals':
              return fieldValue !== value;
            case 'contains':
              return (
                fieldValue && String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
              );
            case 'starts_with':
              return (
                fieldValue &&
                String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
              );
            case 'ends_with':
              return (
                fieldValue && String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
              );
            case 'is_empty':
              return !fieldValue;
            case 'is_not_empty':
              return !!fieldValue;
            case 'greater_than':
              return Number(fieldValue) > Number(value);
            case 'less_than':
              return Number(fieldValue) < Number(value);
            default:
              return true;
          }
        });
      });

      return filteredContacts;
    },
    enabled: !!companyId,
  });

  const createContact = useMutation({
    mutationFn: async (contact: TablesInsert<'contacts'>) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          company_id: companyId!,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar contato:', error);
      toast.error('Erro ao criar contato');
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...contact }: TablesUpdate<'contacts'> & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar contato:', error);
      toast.error('Erro ao atualizar contato');
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contato excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir contato:', error);
      toast.error('Erro ao excluir contato');
    },
  });

  return {
    contacts,
    isLoading,
    createContact: createContact.mutate,
    updateContact: updateContact.mutate,
    deleteContact: deleteContact.mutate,
  };
};
