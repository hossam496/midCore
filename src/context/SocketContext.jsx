import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pusher, setPusher] = useState(null);
  const [channel, setChannel] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // Note: Presence channels are needed for true online status
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingStatus, setTypingStatus] = useState({}); // { conversationId: { isTyping: bool, senderName: string } }

  // Presence heartbeat — backend skips redundant chat FCM while tab is active
  useEffect(() => {
    if (!user) return undefined;

    const ping = () => {
      api.post('/users/presence').catch(() => {});
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (user) {
      // Initialize Pusher
      const pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
        cluster: import.meta.env.VITE_PUSHER_CLUSTER,
        forceTLS: true
      });

      setPusher(pusherInstance);

      // Subscribe to personal channel
      const userChannel = pusherInstance.subscribe(`user-${user._id}`);
      setChannel(userChannel);

      // Listen for events
      userChannel.bind('newMessage', (msg) => {
        // Handled by Messages.jsx listening to this context or direct binding
        // We'll use a custom event emitter pattern or just rely on global listeners
      });

      userChannel.bind('unreadCountUpdate', ({ unreadCount: count }) => {
        setUnreadCount(count);
      });

      userChannel.bind('newNotification', (notification) => {
        playNotificationSound();
        addNotification(notification);

        toast.custom((t) => (
          <div 
            onClick={() => {
              if (notification.link) navigate(notification.link);
              toast.dismiss(t.id);
            }}
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-slate-100 cursor-pointer hover:shadow-xl transition-all`}
          >
             <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{notification.message}</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-slate-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-semibold text-slate-500 hover:bg-slate-50 focus:outline-none transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        ));
      });

      userChannel.bind('displayTyping', ({ conversationId, senderName }) => {
        setTypingStatus(prev => ({ ...prev, [conversationId]: { isTyping: true, senderName } }));
      });

      userChannel.bind('hideTyping', ({ conversationId }) => {
        setTypingStatus(prev => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      });

      return () => {
        if (pusherInstance) {
          try {
            if (userChannel) userChannel.unbind_all();
            if (pusherInstance.connection.state !== 'disconnected') {
               pusherInstance.disconnect();
            }
          } catch (error) {
            // Cleanup silently
          }
        }
      };
    }
  }, [user, addNotification, navigate]);

  const playNotificationSound = () => {
    // Suppress sound error if file is missing
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => { /* Ignore sound errors */ });
    } catch (error) {}
  };

  const emitTyping = useCallback(async (conversationId, receiverId, isTyping) => {
    try {
      await api.post('/conversations/typing', { conversationId, receiverId, isTyping });
    } catch (error) {
      console.error('Typing error:', error);
    }
  }, []);

  /** @deprecated Use participant.isOnline from API (presence heartbeat) */
  const isOnline = useCallback(() => false, []);

  return (
    <SocketContext.Provider value={{ 
      pusher,
      channel,
      isOnline, 
      emitTyping, 
      unreadCount,
      typingStatus
    }}>
      {children}
    </SocketContext.Provider>
  );
};
