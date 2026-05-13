import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, MessageSquare, Calendar, BellRing, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { usePushMessaging } from '../context/PushMessagingContext';
import { formatNotifRelative } from '../utils/notificationDate';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadNotifCount, markRead, markAllRead } = useNotifications();
  const push = usePushMessaging();
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const narrowUiRef = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : true
  );
  const navigate = useNavigate();

  // Close on outside tap — backdrop is not inside bell/panel refs
  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerOutside = (event) => {
      const t = event.target;
      if (bellRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerOutside, true);
  }, [isOpen]);

  // Lock body scroll while sheet is open (mobile only)
  useEffect(() => {
    if (!isOpen) return undefined;
    const mq = window.matchMedia('(max-width: 767px)');
    if (!mq.matches) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

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
    <>
      <div className="relative">
        <div ref={bellRef}>
          {/* Bell — min 44×44 tap target (mobile) */}
          <button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-label="التنبيهات"
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex min-h-11 min-w-11 items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          >
            <Bell className="w-6 h-6" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 px-0.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadNotifCount > 9 ? '+9' : unreadNotifCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile: bottom sheet + backdrop | Desktop: anchored under bell */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px] md:hidden"
                aria-hidden
              />

              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="notif-dropdown-title"
                initial={
                  narrowUiRef.current
                    ? { opacity: 0, y: '100%' }
                    : { opacity: 0, y: 12, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  narrowUiRef.current
                    ? { opacity: 0, y: '100%' }
                    : { opacity: 0, y: 12, scale: 0.97 }
                }
                transition={
                  narrowUiRef.current
                    ? { type: 'spring', damping: 28, stiffness: 320 }
                    : { duration: 0.2, ease: 'easeOut' }
                }
                className="fixed z-[101] flex max-h-[min(88dvh,32rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5
                  inset-x-0 bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]
                  md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:max-h-[min(24rem,calc(100vh-6rem))] md:w-[min(20rem,calc(100vw-2rem))] md:rounded-3xl md:pb-0 md:shadow-2xl"
              >
                {/* Header */}
                <div className="flex shrink-0 flex-col gap-2 border-b border-gray-100 bg-gray-50/80 p-3 sm:p-4">
                  <div className="flex justify-center md:hidden" aria-hidden>
                    <span className="h-1 w-10 shrink-0 rounded-full bg-gray-300" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      id="notif-dropdown-title"
                      className="min-w-0 flex-1 truncate text-base font-bold text-gray-900"
                    >
                      التنبيهات
                    </h3>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                      {push?.configured && push.permission !== 'granted' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            push.requestPushPermission();
                          }}
                          className="touch-manipulation whitespace-nowrap rounded-lg bg-blue-600 px-2 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700 sm:text-xs"
                        >
                          تفعيل الدفع
                        </button>
                      )}
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllRead();
                          }}
                          className="touch-manipulation flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden sm:inline">الكل مقروء</span>
                          <span className="sm:hidden">الكل</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="touch-manipulation rounded-full p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                        aria-label="إغلاق"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* List — min-h-0 lets flex child scroll on iOS */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide [-webkit-overflow-scrolling:touch]">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotifClick(notif)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotifClick(notif);
                      }
                    }}
                    className={`flex cursor-pointer items-start gap-3 border-b border-gray-50 p-3 transition-colors active:bg-gray-100 sm:p-4 touch-manipulation ${
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
                        {formatNotifRelative(notif)}
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
                <div className="shrink-0 border-t border-gray-100 bg-gray-50 p-3 text-center sm:p-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/dashboard/notifications');
                    }}
                    className="touch-manipulation text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800"
                  >
                    عرض كل التنبيهات
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationDropdown;
