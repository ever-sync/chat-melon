// Service Worker para PWA - Cache e notificações push
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

let currentBadgeCount = 0;

// Assets para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

// Instalação - cacheia assets estáticos
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS.filter(url => url !== '/offline.html'));
    }).catch(() => {
      // Falha silenciosa se algum asset não existir
      console.log('Alguns assets não puderam ser cacheados');
    })
  );
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache para requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') return;

  // Ignora manifest.json para evitar problemas de CORS
  if (url.pathname.includes('manifest.json')) return;

  // API do Supabase - Network First com fallback para cache
  if (url.origin.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Assets estáticos - Cache First
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      }).catch(() => {
        if (url.pathname === '/' || url.pathname.endsWith('.html')) {
          return caches.match('/offline.html');
        }
      })
    );
    return;
  }

  // Outras requisições - Network First com cache dinâmico
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match('/offline.html');
        });
      })
  );
});

// Manipular mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_BADGE') {
    currentBadgeCount = event.data.count;
    if ('setAppBadge' in self.navigator) {
      if (currentBadgeCount > 0) {
        self.navigator.setAppBadge(currentBadgeCount);
      } else {
        self.navigator.clearAppBadge();
      }
    }
  } else if (event.data.type === 'CLEAR_BADGE') {
    currentBadgeCount = 0;
    if ('clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge();
    }
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manipular notificações push
self.addEventListener('push', (event) => {
  console.log('Notificação push recebida:', event);
  
  let notificationData = {
    title: 'Nova mensagem',
    body: 'Você recebeu uma nova mensagem',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-message',
    requireInteraction: false,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
      
      // Incrementar badge ao receber notificação
      if (data.incrementBadge) {
        currentBadgeCount++;
        if ('setAppBadge' in self.navigator) {
          self.navigator.setAppBadge(currentBadgeCount);
        }
      }
    } catch (e) {
      console.error('Erro ao processar dados da notificação:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
    })
  );
});

// Manipular cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não existe janela aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow('/chat');
      }
    })
  );
});
