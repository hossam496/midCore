import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Loader2, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('new_notification', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      if (socket) socket.off('new_notification');
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'chat_message': return <MessageSquare size={16} className="text-blue-500" />;
      case 'appointment_reminder': return <Clock size={16} className="text-amber-500" />;
      case 'appointment_status': return <AlertCircle size={16} className="text-emerald-500" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800">التنبيهات</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={32} className="text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium">لا توجد تنبيهات جديدة</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div 
                    key={n._id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    onClick={() => {
                      if (n.link) navigate(n.link);
                      if (!n.isRead) handleMarkAsRead(n._id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-100`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-50 bg-slate-50/50 text-center">
            <button 
              onClick={() => {
                navigate('/dashboard/notifications');
                setIsOpen(false);
              }}
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              عرض الكل
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
