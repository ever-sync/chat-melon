import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMarkAsRead() {
  const markAsRead = useCallback(async (conversationId: string, messageIds?: string[]) => {
    try {
      await supabase.functions.invoke('evolution-mark-as-read', {
        body: { conversationId, messageIds }
      });
    } catch (err) {
      console.error('Erro ao marcar como lido:', err);
    }
  }, []);

  return { markAsRead };
}
