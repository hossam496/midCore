import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from '../api/axios';

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

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Check if serviceWorker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      // Explicitly register the service worker to ensure it's active
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      const vapidKey = 'YOUR_VAPID_KEY';

      if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY') {
        console.warn('⚠️ Firebase VAPID Key is missing or invalid. Push notifications will not work until you add your real key from Firebase Console.');
        return;
      }

      // Get FCM Token
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: vapidKey
      });

      if (token) {
        console.log('FCM Token generated successfully');
        // Save token to backend
        await axios.patch('/users/update-fcm-token', { token });
        return token;
      }
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export default messaging;
