import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';
import { useAuth } from './AuthContext';
import {
  registerDeviceForFcm,
  clearFcmTokenOnServer,
  registerForegroundMessageHandler,
  isFirebaseConfigured,
} from '../firebase/firebaseConfig';
import {
  subscribeToPush,
  unsubscribeFromPush,
  initializePushNotifications,
  isPushSupported,
} from '../utils/pushNotifications';

const PushMessagingContext = createContext(null);

export const usePushMessaging = () => useContext(PushMessagingContext);

/**
 * FCM registration, foreground toasts, presence heartbeat, SW navigate messages.
 * Realtime chat still uses Pusher (SocketContext); FCM covers tab closed / background.
 */
export const PushMessagingProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [pushState, setPushState] = useState({
    supported: false,
    configured: false,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    tokenRegistered: false,
  });
  const tokenRef = useRef(null);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    setPushState((s) => ({ ...s, permission }));

    if (permission !== 'granted') {
      toast('لم يُمنح إذن الإشعارات', { icon: '🔕' });
      return false;
    }

    try {
      let token = null;
      if (isFirebaseConfigured()) {
        token = await registerDeviceForFcm(api);
        tokenRef.current = token;
      }
      const webOk = await subscribeToPush();
      setPushState((s) => ({ ...s, tokenRegistered: !!(token || webOk) }));
      if (token || webOk) {
        toast.success('تم تفعيل إشعارات الخلفية');
        return true;
      }
      toast.error(
        isFirebaseConfigured()
          ? 'تعذر تفعيل الإشعارات'
          : 'فعّل VAPID على السيرفر (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) أو Firebase'
      );
      return false;
    } catch (e) {
      console.error('[Push] register failed', e);
      toast.error('تعذر تفعيل الإشعارات');
      return false;
    }
  }, []);

  // Service worker → client navigation (when notificationclick uses postMessage fallback)
  useEffect(() => {
    const onSwMessage = (event) => {
      if (event?.data?.type === 'MEDCORE_NAVIGATE' && event.data.url) {
        try {
          const u = new URL(event.data.url, window.location.origin);
          navigate(`${u.pathname}${u.search}${u.hash}`);
        } catch {
          window.location.assign(event.data.url);
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage);
  }, [navigate]);

  // Foreground FCM → toast (browser may not show system notification when tab focused)
  useEffect(() => {
    let dispose = () => {};

    if (!isAuthenticated || !isFirebaseConfigured()) {
      return () => dispose();
    }

    let cancelled = false;
    (async () => {
      const off = await registerForegroundMessageHandler((payload) => {
        const title = payload.notification?.title || payload.data?.title || 'MedCore';
        const body = payload.notification?.body || payload.data?.body || '';
        const url =
          payload.data?.openUrl || payload.data?.link || payload.data?.click_action || '/';

        toast.custom(
          (t) => (
            <button
              type="button"
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 text-right`}
              onClick={() => {
                try {
                  const u = new URL(url, window.location.origin);
                  navigate(`${u.pathname}${u.search}${u.hash}`);
                } catch {
                  window.location.assign(url);
                }
                toast.dismiss(t.id);
              }}
            >
              <div className="flex-1 p-4">
                <p className="text-sm font-medium text-gray-900">{title}</p>
                {body ? <p className="mt-1 text-sm text-gray-500 line-clamp-2">{body}</p> : null}
              </div>
            </button>
          ),
          { duration: 6000 }
        );
      });
      if (!cancelled) dispose = off;
    })();

    return () => {
      cancelled = true;
      dispose();
    };
  }, [isAuthenticated, navigate]);

  // After login: optional delayed auto-request (professional UX — not immediate popup)
  useEffect(() => {
    if (!isAuthenticated || !isFirebaseConfigured()) return undefined;

    setPushState((s) => ({
      ...s,
      supported: 'Notification' in window && 'serviceWorker' in navigator,
      configured: true,
      permission: Notification.permission,
    }));

    const timer = setTimeout(async () => {
      if (Notification.permission !== 'granted') return;
      try {
        const token = await registerDeviceForFcm(api);
        tokenRef.current = token;
        setPushState((s) => ({ ...s, tokenRegistered: !!token }));
        await subscribeToPush();
      } catch (e) {
        console.warn('[FCM] silent register skipped', e?.message);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  /** Patients: prompt once for notification permission → Web Push + FCM */
  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;
    if (user.role !== 'user') return undefined;
    if (!isPushSupported()) return undefined;
    if (Notification.permission !== 'default') return undefined;

    const timer = setTimeout(() => {
      initializePushNotifications().catch(() => {});
    }, 7000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  // Presence heartbeat lives in SocketContext (with Pusher) to avoid duplicate requests

  // Logout → clear FCM tokens on server for this session
  useEffect(() => {
    if (isAuthenticated) return;
    unsubscribeFromPush().catch(() => {});
    if (tokenRef.current) {
      clearFcmTokenOnServer(api);
      tokenRef.current = null;
    }
    setPushState((s) => ({ ...s, tokenRegistered: false }));
  }, [isAuthenticated]);

  const value = {
    ...pushState,
    requestPushPermission,
  };

  return (
    <PushMessagingContext.Provider value={value}>{children}</PushMessagingContext.Provider>
  );
};
