import React from 'react';
import { Activity, LogOut, User, Home } from 'lucide-react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const Sidebar = React.forwardRef(({ menuItems, roleName }, ref) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  return (
    <aside
      ref={ref}
      className="fixed left-0 top-0 h-screen w-64 bg-[#0a1128] text-white flex flex-col z-50 shadow-2xl"
    >
      <div className="p-8 pb-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.2em] leading-none">ميدكور</span>
            <span className="text-[10px] text-slate-500 font-medium mt-1">بوابة {roleName}</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 text-slate-400 hover:text-white hover:bg-white/5 mb-4 border-b border-white/5 pb-6"
        >
          <Home size={18} />
          <span className="text-xs font-bold tracking-wider">العودة للموقع</span>
        </Link>

        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => `
              w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                {item.badge && (
                  <span className="absolute left-4 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 space-y-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
            <User size={18} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-white truncate">
              {user?.name || 'Julian Vance'}
            </span>
            <span className="text-[10px] text-slate-500 truncate uppercase tracking-widest">
              {user?.role || roleName}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 font-bold text-xs"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
