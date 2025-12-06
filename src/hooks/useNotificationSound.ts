import { useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export const useNotificationSound = () => {
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

  // Função para tocar som de notificação
  const playSound = useCallback(() => {
    // Verificar se som está habilitado
    if (notificationSettings?.enabled === false) return;
    if (notificationSettings?.sound_enabled === false) return;
    if (isDoNotDisturbActive()) return;

    const volume = notificationSettings?.volume ?? 0.5;

    // Tentar tocar arquivo de áudio primeiro
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notification.mp3");
      }

      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Se falhar, usar Web Audio API como fallback
        playBeep(volume);
      });
    } catch (error) {
      // Se não conseguir criar o áudio, usar beep
      playBeep(volume);
    }
  }, [notificationSettings, isDoNotDisturbActive]);

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

  // Função para testar o som
  const testSound = useCallback(() => {
    const volume = notificationSettings?.volume ?? 0.5;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notification.mp3");
      }

      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        playBeep(volume);
      });
    } catch (error) {
      playBeep(volume);
    }
  }, [notificationSettings?.volume, playBeep]);

  return {
    playSound,
    testSound,
    isDoNotDisturbActive,
    notificationSettings,
  };
};
