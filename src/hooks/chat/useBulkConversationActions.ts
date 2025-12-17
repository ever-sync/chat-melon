import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BulkAction =
  | 'resolve'
  | 'close'
  | 'reopen'
  | 'assign'
  | 'add_label'
  | 'remove_label'
  | 'archive'
  | 'mark_read'
  | 'mark_unread';

interface BulkActionResult {
  success: number;
  failed: number;
  errors: string[];
}

export const useBulkConversationActions = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const queryClient = useQueryClient();

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    if (isSelectionMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectionMode]);

  // Toggle single conversation selection
  const toggleSelection = useCallback((conversationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conversationId)) {
        next.delete(conversationId);
      } else {
        next.add(conversationId);
      }
      return next;
    });
  }, []);

  // Select all conversations
  const selectAll = useCallback((conversationIds: string[]) => {
    setSelectedIds(new Set(conversationIds));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  // Check if a conversation is selected
  const isSelected = useCallback(
    (conversationId: string) => selectedIds.has(conversationId),
    [selectedIds]
  );

  // Bulk resolve
  const bulkResolve = useMutation({
    mutationFn: async (ids: string[]): Promise<BulkActionResult> => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        const { error } = await supabase
          .from('conversations')
          .update({ status: 'closed' })
          .eq('id', id);

        if (error) {
          failed++;
          errors.push(`${id}: ${error.message}`);
        } else {
          success++;
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (result.failed === 0) {
        toast.success(`${result.success} conversas resolvidas`);
      } else {
        toast.warning(`${result.success} resolvidas, ${result.failed} falharam`);
      }
      clearSelection();
    },
    onError: (error) => {
      toast.error('Erro ao resolver conversas: ' + error.message);
    },
  });

  // Bulk close
  const bulkClose = useMutation({
    mutationFn: async (ids: string[]): Promise<BulkActionResult> => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        const { error } = await supabase
          .from('conversations')
          .update({ status: 'closed' })
          .eq('id', id);

        if (error) {
          failed++;
          errors.push(`${id}: ${error.message}`);
        } else {
          success++;
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`${result.success} conversas fechadas`);
      clearSelection();
    },
    onError: (error) => {
      toast.error('Erro ao fechar conversas: ' + error.message);
    },
  });

  // Bulk assign
  const bulkAssign = useMutation({
    mutationFn: async ({
      ids,
      userId,
    }: {
      ids: string[];
      userId: string;
    }): Promise<BulkActionResult> => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        const { error } = await supabase
          .from('conversations')
          .update({ assigned_to: userId })
          .eq('id', id);

        if (error) {
          failed++;
          errors.push(`${id}: ${error.message}`);
        } else {
          success++;
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`${result.success} conversas atribuídas`);
      clearSelection();
    },
    onError: (error) => {
      toast.error('Erro ao atribuir conversas: ' + error.message);
    },
  });

  // Bulk add label
  const bulkAddLabel = useMutation({
    mutationFn: async ({
      ids,
      label,
    }: {
      ids: string[];
      label: string;
    }): Promise<BulkActionResult> => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        // Get current tags
        const { data: conv } = await supabase
          .from('conversations')
          .select('tags')
          .eq('id', id)
          .single();

        const currentTags = conv?.tags || [];
        if (!currentTags.includes(label)) {
          const { error } = await supabase
            .from('conversations')
            .update({ tags: [...currentTags, label] })
            .eq('id', id);

          if (error) {
            failed++;
            errors.push(`${id}: ${error.message}`);
          } else {
            success++;
          }
        } else {
          success++; // Already has the label
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`Label adicionada a ${result.success} conversas`);
      clearSelection();
    },
    onError: (error) => {
      toast.error('Erro ao adicionar label: ' + error.message);
    },
  });

  // Bulk remove label
  const bulkRemoveLabel = useMutation({
    mutationFn: async ({
      ids,
      label,
    }: {
      ids: string[];
      label: string;
    }): Promise<BulkActionResult> => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        // Get current tags
        const { data: conv } = await supabase
          .from('conversations')
          .select('tags')
          .eq('id', id)
          .single();

        const currentTags = conv?.tags || [];
        const newTags = currentTags.filter((t: string) => t !== label);

        const { error } = await supabase
          .from('conversations')
          .update({ tags: newTags })
          .eq('id', id);

        if (error) {
          failed++;
          errors.push(`${id}: ${error.message}`);
        } else {
          success++;
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`Label removida de ${result.success} conversas`);
      clearSelection();
    },
    onError: (error) => {
      toast.error('Erro ao remover label: ' + error.message);
    },
  });

  // Bulk mark as read
  const bulkMarkAsRead = useMutation({
    mutationFn: async (ids: string[]): Promise<BulkActionResult> => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        const { error } = await supabase
          .from('conversations')
          .update({ unread_count: 0 })
          .eq('id', id);

        if (error) {
          failed++;
          errors.push(`${id}: ${error.message}`);
        } else {
          success++;
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`${result.success} conversas marcadas como lidas`);
      clearSelection();
    },
    onError: (error) => {
      toast.error('Erro ao marcar como lidas: ' + error.message);
    },
  });

  // Bulk mark as unread
  const bulkMarkAsUnread = useMutation({
    mutationFn: async (ids: string[]): Promise<BulkActionResult> => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        const { error } = await supabase
          .from('conversations')
          .update({ unread_count: 1 })
          .eq('id', id);

        if (error) {
          failed++;
          errors.push(`${id}: ${error.message}`);
        } else {
          success++;
        }
      }

      return { success, failed, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`${result.success} conversas marcadas como não lidas`);
      clearSelection();
    },
    onError: (error) => {
      toast.error('Erro ao marcar como não lidas: ' + error.message);
    },
  });

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelectionMode,
    toggleSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkResolve,
    bulkClose,
    bulkAssign,
    bulkAddLabel,
    bulkRemoveLabel,
    bulkMarkAsRead,
    bulkMarkAsUnread,
    isProcessing:
      bulkResolve.isPending ||
      bulkClose.isPending ||
      bulkAssign.isPending ||
      bulkAddLabel.isPending ||
      bulkRemoveLabel.isPending ||
      bulkMarkAsRead.isPending ||
      bulkMarkAsUnread.isPending,
  };
};
