import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const socketUrl = import.meta.env.VITE_API_URL.replace('/api', '');
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      setSocket(newSocket);

      // Join personal room
      newSocket.emit('join', user._id);

      // Listen for online users
      newSocket.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      // Listen for unread count updates
      newSocket.on('unreadCountUpdate', ({ unreadCount: count }) => {
        setUnreadCount(count);
      });

      // Global Notification Listener
      newSocket.on('newNotification', (notification) => {
        // Play sound
        playNotificationSound();
        
        // Add to NotificationContext state
        addNotification(notification);

        // Show Toast
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-slate-100`}>
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
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-semibold text-blue-600 hover:bg-slate-50 focus:outline-none transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        ), { duration: 5000, position: 'top-right' });
      });

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user, addNotification]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const emitTyping = useCallback((conversationId, receiverId) => {
    if (socket && user) {
      socket.emit('typing', { conversationId, receiverId, senderName: user.name });
    }
  }, [socket, user]);

  const emitStopTyping = useCallback((conversationId, receiverId) => {
    if (socket) {
      socket.emit('stopTyping', { conversationId, receiverId });
    }
  }, [socket]);

  const isOnline = (userId) => onlineUsers.includes(userId?.toString());

  return (
    <SocketContext.Provider value={{ 
      socket, 
      onlineUsers, 
      isOnline, 
      emitTyping, 
      emitStopTyping,
      unreadCount 
    }}>
      {children}
    </SocketContext.Provider>
  );
};


