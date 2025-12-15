import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

interface NotificationSettings {
  enabled: boolean;
  sound_enabled: boolean;
  volume: number;
  do_not_disturb_enabled: boolean;
  do_not_disturb_start: string;
  do_not_disturb_end: string;
}

// Função para gerar um beep usando Web Audio API
const createBeepSound = (audioContext: AudioContext, volume: number): void => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 880; // Frequência em Hz (nota A5)
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  type: "message" | "task" | "deal" | "inactivity" | "system";
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: any;
  created_at: string;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Buscar configurações de notificação do usuário
  const { data: notificationSettings } = useQuery({
    queryKey: ["notification-settings", currentCompany?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentCompany) return null;

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .eq("company_id", currentCompany.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching notification settings:", error);
        return null;
      }

      return data as NotificationSettings | null;
    },
    enabled: !!currentCompany?.id,
  });

  // Verificar se está no horário de não perturbe
  const isDoNotDisturbActive = useCallback(() => {
    if (!notificationSettings?.do_not_disturb_enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = (notificationSettings.do_not_disturb_start || "22:00").split(":").map(Number);
    const [endHour, endMin] = (notificationSettings.do_not_disturb_end || "08:00").split(":").map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Se o período atravessa a meia-noite
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }, [notificationSettings]);

  // Função para tocar beep usando Web Audio API
  const playBeep = useCallback((volume: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resumir contexto se estiver suspenso
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      createBeepSound(audioContextRef.current, volume);
    } catch (error) {
      console.error("Error playing beep:", error);
    }
  }, []);

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    // Verificar se som está habilitado
    if (notificationSettings?.enabled === false) return;
    if (notificationSettings?.sound_enabled === false) return;
    if (isDoNotDisturbActive()) return;

    const volume = notificationSettings?.volume ?? 0.5;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notification.mp3");
      }

      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Se falhar, usar beep como fallback
        playBeep(volume);
      });
    } catch (error) {
      // Usar beep como fallback
      playBeep(volume);
    }
  }, [notificationSettings, isDoNotDisturbActive, playBeep]);

  // Buscar notificações
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
  });

  // Contagem de não lidas
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Marcar como lida
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Marcar todas como lidas
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Todas as notificações marcadas como lidas");
    },
  });

  // Deletar notificação
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Limpar todas as notificações lidas
  const clearAllRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notificações limpas");
    },
  });

  // Realtime - escutar novas notificações
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Verificar se notificações estão habilitadas
          if (notificationSettings?.enabled === false) return;

          // Verificar se está no modo não perturbe
          if (isDoNotDisturbActive()) return;

          // Adicionar na lista
          queryClient.setQueryData(
            ["notifications"],
            (old: Notification[] = []) => [newNotification, ...old]
          );

          // Mostrar toast
          toast(newNotification.title, {
            description: newNotification.message,
            action: newNotification.action_url
              ? {
                  label: "Ver",
                  onClick: () => {
                    window.location.href = newNotification.action_url!;
                  },
                }
              : undefined,
          });

          // Tocar som de notificação
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, notificationSettings, isDoNotDisturbActive, playNotificationSound]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutateAsync,
    markAllAsRead: markAllAsRead.mutateAsync,
    deleteNotification: deleteNotification.mutateAsync,
    clearAllRead: clearAllRead.mutateAsync,
    playNotificationSound,
    notificationSettings,
  };
};
