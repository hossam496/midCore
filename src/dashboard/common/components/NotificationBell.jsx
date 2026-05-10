import React, { useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2, MessageCircle, Calendar, Info, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationContext';

// ── Notification type icon map ───────────────────────────────────────────────
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
    <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={16} className={cfg.color} />
    </div>
  );
};

// ── Time formatter ───────────────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

// ── Main Bell Component ──────────────────────────────────────────────────────
const NotificationBell = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadNotifCount,
    isDropdownOpen,
    pushStatus,
    toggleDropdown,
    closeDropdown,
    markRead,
    markAllRead,
    clearAll,
  } = useNotifications();

  // ── Close dropdown on outside click ───────────────────────────────────────

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, closeDropdown]);

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    closeDropdown();
    navigate(notif.url || '/');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Button ─────────────────────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        onClick={toggleDropdown}
        className="relative p-2 text-slate-400 hover:text-blue-600 transition-all duration-200 rounded-xl hover:bg-blue-50 group"
        aria-label="الإشعارات"
      >
        <Bell
          size={20}
          className={`transition-all duration-200 ${isDropdownOpen ? 'text-blue-600' : ''}`}
        />

        {/* Unread badge */}
        {unreadNotifCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-pulse shadow-lg shadow-rose-500/40">
            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
          </span>
        )}

        {/* Green dot when push is active */}
        {pushStatus === 'subscribed' && unreadNotifCount === 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────────── */}
      {isDropdownOpen && (
        <div
          id="notification-dropdown"
          className="absolute left-0 top-full mt-3 w-[380px] bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden z-50"
          style={{ animation: 'fadeSlideDown 0.18s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-blue-600" />
              <span className="font-bold text-slate-800 text-sm">الإشعارات</span>
              {unreadNotifCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadNotifCount} جديد
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="تعليم الكل كمقروء"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <CheckCheck size={15} />
                  </button>
                  <button
                    onClick={clearAll}
                    title="مسح الكل"
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
              <button
                onClick={closeDropdown}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Push Status Banner */}
          {pushStatus === 'denied' && (
            <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border-b border-amber-100">
              <BellOff size={14} className="text-amber-500 flex-shrink-0" />
              <p className="text-[11px] text-amber-700 leading-tight">
                الإشعارات معطّلة — لن تصلك إشعارات عند إغلاق التطبيق.
              </p>
            </div>
          )}
          {pushStatus === 'subscribed' && (
            <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
              <p className="text-[11px] text-emerald-700 leading-tight">
                الإشعارات مفعّلة — ستصلك إشعارات حتى عند إغلاق التطبيق.
              </p>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[340px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell size={36} className="opacity-20 mb-3" />
                <p className="text-sm font-medium">لا توجد إشعارات</p>
                <p className="text-xs mt-1 opacity-60">ستظهر إشعاراتك هنا</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-right ${!notif.read ? 'bg-blue-50/40' : ''
                    }`}
                >
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2 text-right">
                      {notif.body}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 text-center">
                {notifications.length} إشعار • يتم الاحتفاظ بآخر 50 إشعار
              </p>
            </div>
          )}
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
