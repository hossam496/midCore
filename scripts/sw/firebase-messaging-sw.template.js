/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '__API_KEY__',
  authDomain: '__AUTH_DOMAIN__',
  projectId: '__PROJECT_ID__',
  storageBucket: '__STORAGE_BUCKET__',
  messagingSenderId: '__MESSAGING_SENDER_ID__',
  appId: '__APP_ID__',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ||
    payload.data?.title ||
    'MedCore';
  const body =
    payload.notification?.body ||
    payload.data?.body ||
    'لديك إشعار جديد';
  const openUrl = payload.data?.openUrl || payload.data?.link || payload.data?.click_action || '/';
  const icon = payload.data?.icon || '/logo192.png';
  const badge = payload.data?.badge || '/badge.png';
  const tag = payload.data?.tag || payload.data?.conversationId || payload.data?.type || 'medcore';

  const options = {
    body,
    icon,
    badge,
    tag: String(tag),
    renotify: true,
    vibrate: [180, 100, 180],
    data: {
      openUrl: String(openUrl),
      conversationId: payload.data?.conversationId || '',
      type: payload.data?.type || '',
    },
  };

  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const openUrl = event.notification?.data?.openUrl || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope.replace(/\/$/, '')) && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(openUrl).then(() => client.focus());
          }
          client.postMessage({ type: 'MEDCORE_NAVIGATE', url: openUrl });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(openUrl);
      }
    })
  );
});
