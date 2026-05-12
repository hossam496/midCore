import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from 'firebase/messaging';

/**
 * Public Firebase web config — safe to expose (same as Firebase Console "Web app").
 * Set VITE_FIREBASE_* in .env / Vercel.
 */
export function getFirebaseWebConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured() {
  const c = getFirebaseWebConfig();
  return !!(c.apiKey && c.projectId && c.appId);
}

let messagingSingleton = null;

export async function getMessagingIfSupported() {
  if (!isFirebaseConfigured()) return null;
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;

  const config = getFirebaseWebConfig();
  const app = getApps().length ? getApp() : initializeApp(config);
  if (!messagingSingleton) {
    messagingSingleton = getMessaging(app);
  }
  return messagingSingleton;
}

/**
 * Subscribe to foreground FCM payloads. Returns unsubscribe function.
 */
export async function registerForegroundMessageHandler(handler) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}

/**
 * Register SW + obtain FCM token and save on backend (cookie auth).
 * @param {import('axios').AxiosInstance} apiClient
 */
export async function registerDeviceForFcm(apiClient) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[FCM] Set VITE_FIREBASE_VAPID_KEY (Web Push certificates in Firebase Console).');
    return null;
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
  });
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) return null;

  await apiClient.patch('/users/update-fcm-token', {
    token,
    userAgent: navigator.userAgent?.slice(0, 512) || '',
  });

  return token;
}

export async function clearFcmTokenOnServer(apiClient) {
  try {
    await apiClient.patch('/users/update-fcm-token', { token: '' });
  } catch {
    /* ignore */
  }
}
