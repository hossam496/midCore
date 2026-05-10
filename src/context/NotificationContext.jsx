import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState('unsupported'); // Simplified
  const { isAuthenticated } = useAuth();

  // Fetch notifications via REST
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      // In a real REST-only app, we might poll this or just fetch on load
      const res = await axios.get('/users/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadNotifCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Replace real-time with polling (every 30 seconds)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadNotifCount(0);
    }
  }, [isAuthenticated]);


  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const closeDropdown = () => setIsDropdownOpen(false);

  const markRead = async (id) => {
    try {
      await axios.patch(`/users/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch('/users/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete('/users/notifications');
      setNotifications([]);
      setUnreadNotifCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
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
        refreshNotifications: fetchNotifications
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
