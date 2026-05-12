import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from '../api/axios';
import toast from 'react-hot-toast';

// Firebase configuration
// REPLACE THIS WITH YOUR OWN FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Handle foreground messages
 * These arrive while the website tab IS OPEN and active
 */
onMessage(messaging, (payload) => {
  console.log('📬 Foreground message received:', payload);
  
  // Show a professional toast
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      onClick={() => {
        window.location.href = payload.data?.link || '/';
        toast.dismiss(t.id);
      }}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {payload.notification?.title || payload.data?.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {payload.notification?.body || payload.data?.body}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          إغلاق
        </button>
      </div>
    </div>
  ), { duration: 5000 });
});

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      const vapidKey = 'YOUR_VAPID_KEY';
      if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY') {
        console.warn('⚠️ Missing VAPID key. Token retrieval skipped.');
        return;
      }

      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: vapidKey
      });

      if (token) {
        console.log('✅ FCM Token generated');
        await axios.patch('/users/update-fcm-token', { token });
        return token;
      }
    }
  } catch (error) {
    console.error('❌ Notification retrieval error:', error);
  }
};

export default messaging;
