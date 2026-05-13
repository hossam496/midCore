import React, { useState } from 'react';
import { Search, Globe, User, Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import getImageUrl from '../../../utils/imageUrl';
import NotificationBell from './NotificationBell';

const Header = ({ onOpenMobileSidebar, desktopCollapsed, onToggleDesktopSidebar }) => {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[55] flex h-16 shrink-0 items-center justify-between gap-2 overflow-visible border-b border-slate-100/80 bg-white/95 px-3 backdrop-blur-md sm:h-20 sm:gap-4 sm:px-4 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 lg:hidden touch-manipulation"
          onClick={onOpenMobileSidebar}
          aria-label="فتح القائمة"
        >
          <Menu size={22} />
        </button>

        <button
          type="button"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 lg:flex touch-manipulation"
          onClick={onToggleDesktopSidebar}
          aria-label={desktopCollapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'}
        >
          {desktopCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div
          className={`relative min-w-0 flex-1 max-w-xl transition-all ${
            searchOpen ? 'flex' : 'hidden sm:flex'
          }`}
        >
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:right-5 sm:h-[18px] sm:w-[18px]" />
          <input
            type="search"
            placeholder="بحث عن مريض، سجل، موعد..."
            className="w-full rounded-xl border-none bg-slate-100 py-2.5 pr-10 pl-3 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 sm:py-3.5 sm:pr-14 sm:pl-4"
            aria-label="بحث"
          />
        </div>

        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 sm:hidden touch-manipulation"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label={searchOpen ? 'إخفاء البحث' : 'إظهار البحث'}
        >
          <Search size={20} />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">
        <button
          type="button"
          className="hidden rounded-xl p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600 sm:flex touch-manipulation"
          aria-label="اللغة"
        >
          <Globe size={20} />
        </button>

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

        <NotificationBell />

        <div className="hidden h-6 w-px bg-slate-200 md:block" />

        <div className="hidden items-center gap-3 md:flex">
          <div className="hidden min-w-0 flex-col items-end -space-y-0.5 lg:flex">
            <span className="max-w-[10rem] truncate text-xs font-bold text-slate-800">{user?.name || 'مستخدم'}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              {user?.role || 'user'}
            </span>
          </div>
          {user?.image ? (
            <img
              src={getImageUrl(user.image)}
              alt=""
              className="h-10 w-10 shrink-0 rounded-2xl border border-slate-200 object-cover sm:h-11 sm:w-11"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 sm:h-11 sm:w-11">
              <User size={20} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
