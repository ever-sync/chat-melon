import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSendPresence(conversationId: string) {
  const lastPresenceRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendPresence = useCallback(async (presence: 'composing' | 'recording' | 'paused') => {
    // Evita enviar a mesma presença repetidamente
    if (lastPresenceRef.current === presence) return;
    
    lastPresenceRef.current = presence;

    try {
      await supabase.functions.invoke('evolution-send-presence', {
        body: { conversationId, presence }
      });
    } catch (err) {
      console.error('Erro ao enviar presença:', err);
    }

    // Auto-pausar após 5 segundos
    if (presence !== 'paused') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        sendPresence('paused');
      }, 5000);
    }
  }, [conversationId]);

  const startTyping = useCallback(() => sendPresence('composing'), [sendPresence]);
  const startRecording = useCallback(() => sendPresence('recording'), [sendPresence]);
  const stopPresence = useCallback(() => sendPresence('paused'), [sendPresence]);

  return { startTyping, startRecording, stopPresence };
}
