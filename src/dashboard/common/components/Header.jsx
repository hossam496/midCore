import React from 'react';
import { Search, Globe, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getFullImageUrl } from '../../../api/axiosInstance';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-slate-100 sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search patients, records, or appointments..."
            className="w-full bg-[#f1f5f9] border-none rounded-xl py-3.5 pl-14 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-medium"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-all rounded-xl hover:bg-blue-50">
          <Globe size={20} />
        </button>

        <div className="h-6 w-[1px] bg-slate-200" />

        {/* User info */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end -space-y-1">
            <span className="text-xs font-bold text-slate-800">{user?.name || 'مستخدم'}</span>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user?.role || 'user'}</span>
          </div>
          {user?.image ? (
            <img
              src={getFullImageUrl(user.image)}
              alt="Profile"
              className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
