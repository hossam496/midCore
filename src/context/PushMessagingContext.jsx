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

const PushMessagingContext = createContext(null);

export const usePushMessaging = () => useContext(PushMessagingContext);

/**
 * FCM registration, foreground toasts, presence heartbeat, SW navigate messages.
 * Realtime chat still uses Pusher (SocketContext); FCM covers tab closed / background.
 */
export const PushMessagingProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pushState, setPushState] = useState({
    supported: false,
    configured: false,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    tokenRegistered: false,
  });
  const tokenRef = useRef(null);

  const requestPushPermission = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      toast.error('إشعارات الدفع غير مهيأة. أضف مفاتيح Firebase في البيئة.');
      return false;
    }
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    setPushState((s) => ({ ...s, permission }));

    if (permission !== 'granted') {
      toast('لم يُمنح إذن الإشعارات', { icon: '🔕' });
      return false;
    }

    try {
      const token = await registerDeviceForFcm(api);
      tokenRef.current = token;
      setPushState((s) => ({ ...s, tokenRegistered: !!token }));
      if (token) toast.success('تم تفعيل إشعارات الخلفية');
      return !!token;
    } catch (e) {
      console.error('[FCM] register failed', e);
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
      } catch (e) {
        console.warn('[FCM] silent register skipped', e?.message);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Presence heartbeat lives in SocketContext (with Pusher) to avoid duplicate requests

  // Logout → clear FCM tokens on server for this session
  useEffect(() => {
    if (isAuthenticated) return;
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
