import React, { useEffect } from 'react';
import { Activity, LogOut, User, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

const Sidebar = ({
  menuItems,
  roleName,
  mobileOpen,
  onMobileClose,
  desktopCollapsed,
  onToggleDesktopCollapse,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    onMobileClose();
  }, [location.pathname, onMobileClose]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    onMobileClose();
    navigate('/');
  };

  const SidebarNav = ({ mobile }) => (
    <>
      <div className={`border-b border-white/5 ${desktopCollapsed && !mobile ? 'px-3 py-6 lg:px-2' : 'p-6 pb-8 lg:p-8 lg:pb-10'}`}>
        <Link to="/" onClick={onMobileClose} className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 transition-transform group-hover:scale-105">
            <Activity size={20} className="text-white" />
          </div>
          <div
            className={`flex min-w-0 flex-col overflow-hidden transition-opacity duration-200 ${
              desktopCollapsed && !mobile ? 'lg:pointer-events-none lg:w-0 lg:opacity-0' : ''
            }`}
          >
            <span className="text-sm font-bold leading-none tracking-[0.2em]">ميدكور</span>
            <span className="mt-1 text-[10px] font-medium text-slate-500">بوابة {roleName}</span>
          </div>
        </Link>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-4 lg:px-4">
        <Link
          to="/"
          onClick={onMobileClose}
          className="mb-4 flex w-full items-center gap-3 rounded-xl border-b border-white/5 px-3 py-3 text-slate-400 transition-all duration-300 hover:bg-white/5 hover:text-white lg:gap-4 lg:px-4 lg:py-3.5"
        >
          <Home size={18} className="shrink-0" />
          <span
            className={`text-xs font-bold tracking-wider transition-opacity duration-200 ${
              desktopCollapsed && !mobile ? 'lg:hidden' : ''
            }`}
          >
            العودة للموقع
          </span>
        </Link>

        {menuItems.map((item, index) => (
          <NavLink
            key={`${mobile ? 'm' : 'd'}-${index}`}
            to={item.path}
            onClick={onMobileClose}
            title={item.label}
            className={({ isActive }) =>
              `group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 lg:gap-4 lg:px-4 lg:py-3.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } ${desktopCollapsed && !mobile ? 'lg:justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  className={`shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span
                  className={`text-xs font-bold tracking-wider transition-opacity duration-200 ${
                    desktopCollapsed && !mobile ? 'lg:hidden' : ''
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span className="absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-400 lg:left-2" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/5 p-4 lg:p-6">
        <div className={`flex items-center gap-3 px-1 ${desktopCollapsed && !mobile ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-400">
            <User size={18} />
          </div>
          <div
            className={`min-w-0 flex-1 overflow-hidden transition-opacity duration-200 ${
              desktopCollapsed && !mobile ? 'lg:hidden' : ''
            }`}
          >
            <span className="block truncate text-xs font-bold text-white">{user?.name || 'مستخدم'}</span>
            <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-widest text-slate-500">
              {user?.role || roleName}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold text-rose-400 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-300 lg:px-4"
        >
          <LogOut size={18} className="shrink-0" />
          <span className={desktopCollapsed && !mobile ? 'lg:hidden' : ''}>تسجيل الخروج</span>
        </button>

        {!mobile && (
          <button
            type="button"
            onClick={onToggleDesktopCollapse}
            className="hidden w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-[10px] font-bold text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:flex"
            aria-label={desktopCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {desktopCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="إغلاق القائمة"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-900/55 backdrop-blur-[2px] lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className={`fixed left-0 top-0 z-[70] flex h-full min-h-[100dvh] w-[min(20rem,90vw)] max-w-full flex-col bg-[#0a1128] text-white shadow-2xl lg:hidden ${
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <SidebarNav mobile />
      </motion.aside>

      <aside
        className={`fixed left-0 top-0 z-[50] hidden h-screen min-h-0 flex-col bg-[#0a1128] text-white shadow-2xl transition-[width] duration-300 ease-out lg:flex ${
          desktopCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarNav mobile={false} />
      </aside>
    </>
  );
};

export default Sidebar;
