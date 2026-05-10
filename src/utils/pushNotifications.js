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

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

    // 1. Get the active service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 2. Fetch VAPID public key from backend
    const resp = await fetch(`${API_BASE}/push/vapid-public-key`);
    const { publicKey } = await resp.json();

    // 3. Create push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 4. Send to backend
    await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(subscription),
    });

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
    await fetch(`${API_BASE}/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
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

  const success = await subscribeToPush();
  return success ? 'subscribed' : 'error';
}
