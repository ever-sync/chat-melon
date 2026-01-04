import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

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
  oscillator.type = 'sine';

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
  type: 'message' | 'task' | 'deal' | 'inactivity' | 'system';
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
    queryKey: ['notification-settings', currentCompany?.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany) return null;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification settings:', error);
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

    const [startHour, startMin] = (notificationSettings.do_not_disturb_start || '22:00')
      .split(':')
      .map(Number);
    const [endHour, endMin] = (notificationSettings.do_not_disturb_end || '08:00')
      .split(':')
      .map(Number);

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
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      createBeepSound(audioContextRef.current, volume);
    } catch (error) {
      console.error('Error playing beep:', error);
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
        audioRef.current = new Audio('/notification.mp3');
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

  // Buscar notificações filtradas por empresa
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentCompany?.id],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany) return [];

      console.log('🔔 Buscando notificações para empresa:', currentCompany.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao buscar notificações:', error);
        throw error;
      }
      return data as Notification[];
    },
    enabled: !!currentCompany?.id,
  });

  // Contagem de não lidas
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Marcar como lida
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentCompany?.id] });
    },
  });

  // Marcar todas como lidas
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany) throw new Error('Not authenticated or no company selected');

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .eq('is_read', false)
        .select();

      if (error) {
        console.error('❌ Erro ao marcar todas como lidas:', error);
        throw error;
      }

      console.log(`✅ Marcadas ${data?.length || 0} notificações como lidas`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentCompany?.id] });
      const count = data?.length || 0;
      if (count > 0) {
        toast.success(`${count} notificação${count > 1 ? 'ões' : ''} marcada${count > 1 ? 's' : ''} como lida${count > 1 ? 's' : ''}`);
      } else {
        toast.info('Nenhuma notificação não lida');
      }
    },
    onError: (error) => {
      console.error('❌ Erro em markAllAsRead:', error);
      toast.error('Erro ao marcar notificações como lidas');
    },
  });

  // Deletar notificação
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentCompany?.id] });
    },
  });

  // Limpar todas as notificações lidas
  const clearAllRead = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany) throw new Error('Not authenticated or no company selected');

      // Primeiro, contar quantas serão deletadas
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .eq('is_read', true);

      console.log(`🗑️ Deletando ${count || 0} notificações lidas`);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id)
        .eq('is_read', true);

      if (error) {
        console.error('❌ Erro ao deletar notificações:', error);
        throw error;
      }

      return count || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentCompany?.id] });
      if (count > 0) {
        toast.success(`${count} notificação${count > 1 ? 'ões' : ''} removida${count > 1 ? 's' : ''}`);
      } else {
        toast.info('Nenhuma notificação lida para remover');
      }
    },
    onError: (error) => {
      console.error('❌ Erro em clearAllRead:', error);
      toast.error('Erro ao limpar notificações');
    },
  });

  // Realtime - escutar novas notificações com filtro de empresa
  useEffect(() => {
    if (!currentCompany?.id) return;

    console.log('📡 Iniciando realtime de notificações para:', currentCompany.id);

    const channel = supabase
      .channel(`notifications-${currentCompany.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${currentCompany.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Verificar se notificações estão habilitadas
          if (notificationSettings?.enabled === false) return;

          // Verificar se está no modo não perturbe
          if (isDoNotDisturbActive()) return;

          // Atualizar cache do React Query de forma imutável
          queryClient.setQueryData(['notifications', currentCompany.id], (old: Notification[] = []) => {
            // Evitar duplicatas
            if (old.some(n => n.id === newNotification.id)) return old;
            return [newNotification, ...old];
          });

          // Mostrar toast
          toast(newNotification.title, {
            description: newNotification.message,
            action: newNotification.action_url
              ? {
                  label: 'Ver',
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
      console.log('🔌 Desconectando realtime de notificações:', currentCompany.id);
      supabase.removeChannel(channel);
    };
  }, [queryClient, currentCompany?.id, notificationSettings, isDoNotDisturbActive, playNotificationSound]);

  // Deletar TODAS as notificações (independente se lidas ou não)
  const clearAll = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany) throw new Error('Not authenticated or no company selected');

      // Contar todas as notificações
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id);

      console.log(`🗑️ Deletando TODAS as ${count || 0} notificações`);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('company_id', currentCompany.id);

      if (error) {
        console.error('❌ Erro ao deletar todas as notificações:', error);
        throw error;
      }

      return count || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentCompany?.id] });
      if (count > 0) {
        toast.success(`${count} notificação${count > 1 ? 'ões' : ''} removida${count > 1 ? 's' : ''}`);
      } else {
        toast.info('Nenhuma notificação para remover');
      }
    },
    onError: (error) => {
      console.error('❌ Erro em clearAll:', error);
      toast.error('Erro ao limpar notificações');
    },
  });


  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutateAsync,
    markAllAsRead: markAllAsRead.mutateAsync,
    deleteNotification: deleteNotification.mutateAsync,
    clearAllRead: clearAllRead.mutateAsync,
    clearAll: clearAll.mutateAsync,
    playNotificationSound,
    notificationSettings,
  };
};
