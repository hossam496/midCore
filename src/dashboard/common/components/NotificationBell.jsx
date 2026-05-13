import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X, CheckCheck, MessageCircle, Calendar, Info, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../../context/NotificationContext';
import { usePushMessaging } from '../../../context/PushMessagingContext';

const TYPE_CONFIG = {
  message: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  booking: { icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  appointment: { icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-50' },
  info: { icon: Info, color: 'text-slate-500', bg: 'bg-slate-50' },
};

const NotifIcon = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
      <Icon size={16} className={cfg.color} />
    </div>
  );
};

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

const NotificationBell = () => {
  const navigate = useNavigate();
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { notifications, unreadNotifCount, markRead, markAllRead } = useNotifications();
  const push = usePushMessaging();

  const pushBanner =
    push?.permission === 'denied'
      ? 'denied'
      : push?.permission === 'granted' && push?.tokenRegistered
        ? 'subscribed'
        : null;

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      const t = e.target;
      if (bellRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    return () => document.removeEventListener('pointerdown', onPointer, true);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (!mq.matches) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleNotifClick = (notif) => {
    const id = notif._id || notif.id;
    if (id) markRead(id);
    setOpen(false);
    const link = notif.link || notif.url;
    if (link) navigate(link);
  };

  const notifKey = (n, i) => n._id || n.id || `n-${i}`;
  const notifTitle = (n) => n.title || '';
  const notifBody = (n) => n.message || n.body || '';
  const notifTime = (n) => n.createdAt || n.date;

  return (
    <div className="relative inline-flex shrink-0 items-center">
      <div ref={bellRef}>
        <button
          type="button"
          id="notification-bell-btn"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="الإشعارات"
          onClick={toggle}
          className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 touch-manipulation"
        >
          <Bell size={20} className={open ? 'text-blue-600' : ''} />
          {unreadNotifCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg shadow-rose-500/40">
              {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
            </span>
          )}
          {pushBanner === 'subscribed' && unreadNotifCount === 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-emerald-400" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="nb-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-900/45 backdrop-blur-[1px] lg:hidden"
              aria-hidden
              onClick={close}
            />

            <motion.div
              key="nb-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dash-notif-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed z-[85] flex max-h-[min(88dvh,28rem)] w-[min(calc(100vw-1.5rem),24rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl
                left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-auto max-lg:max-h-[85dvh] max-lg:w-full max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-b-none max-lg:rounded-t-3xl max-lg:pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]
                lg:absolute lg:inset-auto lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:max-h-[min(24rem,calc(100vh-6rem))] lg:w-[min(22rem,calc(100vw-2rem))] lg:translate-x-0 lg:translate-y-0"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex justify-center lg:hidden" aria-hidden>
                    <span className="h-1 w-10 rounded-full bg-slate-300" />
                  </div>
                  <Bell size={16} className="hidden shrink-0 text-blue-600 sm:block" />
                  <span id="dash-notif-title" className="truncate text-sm font-bold text-slate-800">
                    الإشعارات
                  </span>
                  {unreadNotifCount > 0 && (
                    <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                      {unreadNotifCount} جديد
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead()}
                      title="تعليم الكل كمقروء"
                      className="touch-manipulation rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="touch-manipulation rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="إغلاق"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {pushBanner === 'denied' && (
                <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-4 py-3 sm:px-5">
                  <BellOff size={14} className="shrink-0 text-amber-500" />
                  <p className="text-[11px] leading-tight text-amber-800">
                    الإشعارات معطّلة — لن تصلك تنبيهات عند إغلاق التطبيق.
                  </p>
                </div>
              )}
              {pushBanner === 'subscribed' && (
                <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-4 py-3 sm:px-5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <p className="text-[11px] leading-tight text-emerald-800">إشعارات الدفع مفعّلة.</p>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Bell size={36} className="mb-3 opacity-20" />
                    <p className="text-sm font-medium">لا توجد إشعارات</p>
                    <p className="mt-1 text-xs opacity-60">ستظهر إشعاراتك هنا</p>
                  </div>
                ) : (
                  notifications.map((notif, idx) => (
                    <button
                      key={notifKey(notif, idx)}
                      type="button"
                      onClick={() => handleNotifClick(notif)}
                      className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3.5 text-right transition-colors last:border-0 hover:bg-slate-50 sm:px-5 touch-manipulation ${
                        !notif.isRead && !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <NotifIcon type={notif.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-xs font-bold ${
                              !notif.isRead && !notif.read ? 'text-slate-800' : 'text-slate-600'
                            }`}
                          >
                            {notifTitle(notif)}
                          </p>
                          {notifTime && (
                            <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(notifTime)}</span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-right text-[11px] leading-relaxed text-slate-500">
                          {notifBody(notif)}
                        </p>
                      </div>
                      {!notif.isRead && !notif.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-center sm:px-5">
                  <p className="text-[10px] text-slate-400">{notifications.length} إشعار</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
