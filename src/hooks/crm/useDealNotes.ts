import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export type DealNote = {
  id: string;
  deal_id: string;
  user_id: string | null;
  company_id: string | null;
  note: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export const useDealNotes = (dealId?: string) => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  // Query para buscar notas
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['deal-notes', dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data, error } = await supabase
        .from('deal_notes')
        .select(
          `
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('deal_id', dealId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DealNote[];
    },
    enabled: !!dealId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutation para criar nota
  const createNote = useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      if (!dealId) {
        throw new Error('Deal ID não disponível');
      }

      const { data, error } = await supabase.rpc('create_deal_note', {
        p_deal_id: dealId,
        p_note: note,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] });
      toast.success('Nota adicionada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar nota: ' + error.message);
    },
  });

  // Mutation para atualizar nota
  const updateNote = useMutation({
    mutationFn: async ({ noteId, note }: { noteId: string; note: string }) => {
      const { data, error } = await supabase.rpc('update_deal_note', {
        p_note_id: noteId,
        p_note: note,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
      toast.success('Nota atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar nota: ' + error.message);
    },
  });

  // Mutation para fixar/desafixar nota
  const togglePin = useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) => {
      const { data, error } = await supabase
        .from('deal_notes')
        .update({ is_pinned: isPinned })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
      toast.success(variables.isPinned ? 'Nota fixada!' : 'Nota desfixada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao fixar nota: ' + error.message);
    },
  });

  // Mutation para deletar nota
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { data, error } = await supabase.rpc('delete_deal_note', {
        p_note_id: noteId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
      toast.success('Nota excluída!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir nota: ' + error.message);
    },
  });

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    togglePin,
    deleteNote,
  };
};
