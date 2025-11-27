import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PresenceIndicatorProps {
  conversationId: string;
}

export function PresenceIndicator({ conversationId }: PresenceIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresence = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('is_online, is_typing, is_recording, last_seen')
        .eq('id', conversationId)
        .maybeSingle();

      if (data) {
        setIsOnline(data.is_online || false);
        setIsTyping(data.is_typing || false);
        setIsRecording(data.is_recording || false);
        setLastSeen(data.last_seen);
      }
    };

    fetchPresence();

    // Realtime subscription
    const channel = supabase
      .channel(`presence:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          const data = payload.new;
          setIsOnline(data.is_online || false);
          setIsTyping(data.is_typing || false);
          setIsRecording(data.is_recording || false);
          setLastSeen(data.last_seen);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  if (isTyping) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex gap-1">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
        </span>
        digitando
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        gravando áudio
      </div>
    );
  }

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span className="w-2 h-2 bg-green-600 rounded-full" />
        online
      </div>
    );
  }

  if (lastSeen) {
    return (
      <div className="text-sm text-muted-foreground">
        visto {formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: ptBR })}
      </div>
    );
  }

  return null;
}