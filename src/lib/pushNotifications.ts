import { supabase } from '@/integrations/supabase/client';

/**
 * Sistema de Push Notifications Web
 */

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Solicita permissão para notificações
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notificações não suportadas neste navegador');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    await subscribeToPush();
  }

  return permission;
};

/**
 * Inscreve-se para push notifications
 */
export const subscribeToPush = async (): Promise<PushSubscriptionData | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications não suportadas');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Busca subscription existente
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Cria nova subscription
      // NOTA: Você precisará de um VAPID public key em produção
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null, // Adicione sua VAPID public key aqui
      });
    }

    if (subscription) {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
      };

      // Salva subscription no backend
      await savePushSubscription(subscriptionData);

      return subscriptionData;
    }
  } catch (error) {
    console.error('Erro ao inscrever para push:', error);
  }

  return null;
};

/**
 * Desinscreve de push notifications
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove do backend
      await removePushSubscription(subscription.endpoint);

      return true;
    }
  } catch (error) {
    console.error('Erro ao desinscrever de push:', error);
  }

  return false;
};

/**
 * Envia notificação local (não-push)
 */
export const showLocalNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  });
};

/**
 * Salva push subscription no Supabase
 */
const savePushSubscription = async (subscriptionData: PushSubscriptionData) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // TODO: Criar tabela push_subscriptions para armazenar dados de subscription
  console.log('Push subscription salva:', subscriptionData);
};

/**
 * Remove push subscription do backend
 */
const removePushSubscription = async (endpoint: string) => {
  // Implementar remoção quando tiver tabela push_subscriptions
  console.log('Removendo subscription:', endpoint);
};

/**
 * Converte ArrayBuffer para Base64
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

/**
 * Atualiza badge count
 */
export const setBadgeCount = (count: number) => {
  if ('serviceWorker' in navigator && 'setAppBadge' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: 'SET_BADGE',
        count,
      });
    });
  }
};

/**
 * Limpa badge
 */
export const clearBadge = () => {
  if ('serviceWorker' in navigator && 'clearAppBadge' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({
        type: 'CLEAR_BADGE',
      });
    });
  }
};
