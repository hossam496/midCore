importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// REPLACE THESE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.data?.title || payload.notification?.title || 'تنبيه جديد';
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || 'لديك إشعار جديد من MedCore',
    icon: '/logo192.png', // Ensure this exists in your public folder
    badge: '/badge.png', // Small icon for notification bar
    image: payload.data?.image || null,
    vibrate: [200, 100, 200],
    tag: payload.data?.type || 'general', // Prevents duplicate notifications of same type
    renotify: true,
    data: {
      url: payload.data?.link || '/', // The URL to open on click
    },
    actions: [
      { action: 'open', title: 'عرض التفاصيل' },
      { action: 'close', title: 'إغلاق' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
