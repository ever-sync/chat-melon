import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { usePaginatedQuery } from '@/hooks/ui/usePaginatedQuery';
import { PAGINATION } from '@/config/constants';
import { useCachedQuery } from '@/hooks/ui/useCachedQuery';
import { CACHE_TAGS } from '@/lib/cache/cache-strategies';

export const useContacts = (segmentId?: string, options?: { page?: number; pageSize?: number }) => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  // Hook paginado para contatos
  const contactsQuery = usePaginatedQuery({
    queryKey: ['contacts', companyId, segmentId],
    queryFn: async ({ page, limit, offset }) => {
      if (!companyId) {
        return { data: [], count: 0 };
      }

      // Sem filtro de segmento, buscar com paginação
      if (!segmentId) {
        const { data, error, count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact' })
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('name')
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return { data: data || [], count: count || 0 };
      }

      // Com filtro de segmento, precisamos buscar todos e filtrar
      // (limitação: filtros complexos não podem ser feitos no servidor)
      const { data: segment } = await supabase
        .from('segments')
        .select('filters')
        .eq('id', segmentId)
        .single();

      // Se segmento não tem filtros, buscar com paginação normal
      if (!segment?.filters || !Array.isArray(segment.filters)) {
        const { data, error, count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact' })
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('name')
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return { data: data || [], count: count || 0 };
      }

      // Para segmentos com filtros complexos, buscar todos e filtrar
      // Nota: Isso não é ideal para grandes volumes, mas necessário para filtros complexos
      const { data: allContacts, error, count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      if (!allContacts) return { data: [], count: 0 };

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

      // Aplicar paginação manualmente após filtrar
      const paginatedContacts = filteredContacts.slice(offset, offset + limit);

      return { data: paginatedContacts, count: filteredContacts.length };
    },
    enabled: !!companyId,
    pageSize: options?.pageSize || PAGINATION.LIST_PAGE_SIZE,
    initialPage: options?.page || 1,
  });

  const contacts = contactsQuery.data || [];
  const isLoading = contactsQuery.isLoading;

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
    createContact,
    updateContact,
    deleteContact,
    // Paginação
    pagination: {
      page: contactsQuery.page,
      pageSize: contactsQuery.pageSize,
      total: contactsQuery.total,
      totalPages: contactsQuery.totalPages,
      hasNext: contactsQuery.hasNext,
      hasPrev: contactsQuery.hasPrev,
      nextPage: contactsQuery.nextPage,
      prevPage: contactsQuery.prevPage,
      goToPage: contactsQuery.goToPage,
      setPageSize: contactsQuery.setPageSize,
    },
  };
};
