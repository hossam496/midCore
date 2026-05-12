import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, MessageSquare, Calendar, BellRing, User } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadNotifCount, markRead, markAllRead } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'chat_message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'appointment_reminder': return <BellRing className="w-4 h-4 text-orange-500" />;
      case 'appointment_status': return <Calendar className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markRead(notif._id);
    setIsOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadNotifCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadNotifCount > 9 ? '+9' : unreadNotifCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">التنبيهات</h3>
              {unreadNotifCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> تحديد الكل كمقروء
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotifClick(notif)}
                    className={`p-4 border-b border-gray-50 flex items-start gap-3 cursor-pointer transition-colors ${
                      !notif.isRead ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      <div className={`p-2 rounded-lg ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                        {getIcon(notif.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-700'} truncate`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">لا توجد تنبيهات حالياً</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard/notifications');
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider"
              >
                عرض كل التنبيهات
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
