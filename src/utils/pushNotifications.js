/**
 * MedCore Push Notification Frontend Utility
 *
 * Handles:
 *  1. Checking browser push support
 *  2. Requesting notification permission
 *  3. Subscribing user via VAPID
 *  4. Sending subscription to backend
 *  5. Unsubscribing on logout
 */
import api from './axios';
import { isFirebaseConfigured, registerDeviceForFcm } from '../firebase/firebaseConfig';
/**
 * Convert a base64 VAPID public key to a Uint8Array
 * (required by pushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Check if Web Push is fully supported in this browser
 */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get the current notification permission state
 * @returns {'granted' | 'denied' | 'default'}
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 * @returns {Promise<'granted' | 'denied' | 'default'>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe the current user to Web Push via service worker.
 * Sends the resulting subscription to the backend.
 * @returns {Promise<boolean>} true if subscribed successfully
 */
export async function subscribeToPush() {
  try {
    if (!isPushSupported()) {
      console.warn('[Push] Web Push not supported in this browser.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    const { data } = await api.get('/push/vapid-public-key');
    if (!data?.publicKey) {
      if (import.meta.env.DEV) {
        console.info('[Push] VAPID not configured on server — skip Web Push subscription.');
      }
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });

    await api.post('/push/subscribe', subscription.toJSON());

    console.log('[MedCore] Push subscription saved to backend.');
    return true;
  } catch (err) {
    console.error('[Push] Subscribe error:', err);
    return false;
  }
}

/**
 * Unsubscribe current device from push notifications.
 * Also notifies the backend to remove the subscription record.
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush() {
  try {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true;

    // Tell backend to remove it
    await api.delete('/push/unsubscribe', {
      data: { endpoint: subscription.endpoint },
    });

    // Unsubscribe locally
    await subscription.unsubscribe();
    console.log('[MedCore] Unsubscribed from push notifications.');
    return true;
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
    return false;
  }
}

/**
 * Full setup flow: request permission → subscribe → send to backend.
 * Call this after login.
 * @returns {Promise<'subscribed' | 'denied' | 'unsupported' | 'error'>}
 */
export async function initializePushNotifications() {
  if (!isPushSupported()) return 'unsupported';

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return 'denied';

  const webOk = await subscribeToPush();
  let fcmOk = false;
  if (isFirebaseConfigured()) {
    try {
      const token = await registerDeviceForFcm(api);
      fcmOk = !!token;
    } catch (e) {
      console.warn('[FCM] register after web push', e?.message);
    }
  }

  return webOk || fcmOk ? 'subscribed' : 'error';
}
