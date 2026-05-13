/* MedCore unified Service Worker: PWA shell + Firebase Cloud Messaging (no Socket.IO) */
/* global firebase */
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title =
      payload.notification?.title || payload.data?.title || 'MedCore';
    const body =
      payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
    const openUrl =
      payload.data?.openUrl ||
      payload.data?.redirectUrl ||
      payload.data?.link ||
      payload.data?.click_action ||
      '/';
    const icon = payload.data?.icon || '/icons/icon-192x192.png';
    const badge = payload.data?.badge || '/icons/badge-72x72.png';
    const tag =
      payload.data?.tag ||
      (payload.data?.conversationId
        ? `chat-${payload.data.conversationId}`
        : 'medcore');

    return self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: String(tag),
      renotify: true,
      vibrate: [180, 100, 180],
      data: { openUrl: String(openUrl) },
    });
  });
}

/** Web Push (VAPID / web-push library) — payload is JSON from our Node server */
self.addEventListener('push', (event) => {
  let payload = {
    title: 'MedCore',
    body: '',
    url: '/',
    tag: 'medcore',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    try {
      const t = event.data?.text();
      if (t) payload.body = t;
    } catch {
      /* ignore */
    }
  }

  const openUrl = String(payload.url || '/');
  event.waitUntil(
    self.registration.showNotification(payload.title || 'MedCore', {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      tag: String(payload.tag || 'medcore'),
      renotify: true,
      vibrate: [180, 100, 180],
      data: { openUrl },
    })
  );
});

const CACHE_NAME = 'medcore-v3';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed:', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.url.includes('/api/')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(
          () =>
            new Response('Offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
        );
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const openUrl = event.notification?.data?.openUrl || '/';
  const fullUrl = new URL(openUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(fullUrl).then(() => client.focus());
          }
          client.postMessage({ type: 'MEDCORE_NAVIGATE', url: fullUrl });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
