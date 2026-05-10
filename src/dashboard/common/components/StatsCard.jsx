import React from 'react';
import { TrendingUp, TrendingDown, Users, FileText, Activity } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, trend, trendValue, secondaryText, progress, variant }) => {
  if (variant === 'blue') {
    return (
      <div className="bg-[#0047ff] p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] opacity-70 uppercase">{title}</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight">{value}</h3>
          </div>
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Icon size={20} className="text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] font-bold opacity-80">{secondaryText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 stats-card group hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className="p-2.5 bg-[#f1f5f9] rounded-xl text-blue-600">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {trend && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
            <TrendingUp size={14} />
            {trendValue}
          </div>
        )}
        <p className="text-[11px] font-bold text-slate-400">{secondaryText}</p>
      </div>
    </div>
  );
};

export default StatsCard;


