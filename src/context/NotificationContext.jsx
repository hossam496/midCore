import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pushStatus] = useState('unsupported');
  const { isAuthenticated } = useAuth();

  // Fetch notifications via REST
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/users/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadNotifCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Silently fail — don't crash the app if notifications are unavailable
      if (import.meta.env.DEV) {
        console.warn('Notifications fetch failed:', err?.response?.data?.message || err.message);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll every 60 seconds (Vercel serverless — avoid too-frequent cold starts)
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadNotifCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  const toggleDropdown = () => setIsDropdownOpen(prev => !prev);
  const closeDropdown = () => setIsDropdownOpen(false);

  const markRead = async (id) => {
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      if (import.meta.env.DEV) console.warn('markRead failed:', err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/users/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('markAllRead failed:', err.message);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/users/notifications');
      setNotifications([]);
      setUnreadNotifCount(0);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('clearAll failed:', err.message);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadNotifCount,
        isDropdownOpen,
        pushStatus,
        toggleDropdown,
        closeDropdown,
        markRead,
        markAllRead,
        clearAll,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
