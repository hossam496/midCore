import React, { useState, useEffect } from 'react';
import { getAdminStats } from '../../../api/statsApi';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Bed, 
  Download, 
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';

const Reports = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminStats();
        setStatsData(res.data.stats);
      } catch (err) {
        console.error('Failed to fetch reports stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { title: 'REVENUE TREND', value: `$${statsData?.monthlyRevenue?.toLocaleString() || '0'}`, trend: '+12.5%', icon: TrendingUp, iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
    { title: 'AVG WAIT TIME', value: '18m', trend: '+4 min', icon: Clock, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', trendColor: 'text-rose-500' },
    { title: 'CLINICAL OUTCOMES', value: statsData?.clinicalOutcomes || '94.8%', trend: '+3.2%', icon: Target, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50' },
    { title: 'OCCUPANCY RATE', value: statsData?.occupancyRate || '82.1%', trend: 'Stable', icon: Bed, iconColor: 'text-purple-500', iconBg: 'bg-purple-50', trendColor: 'text-slate-400' },
  ];

  const waitTimes = statsData?.waitTimes || [
    { dept: 'Emergency', time: '24m', percent: 90, color: 'bg-rose-500' },
    { dept: 'Pediatrics', time: '12m', percent: 45, color: 'bg-emerald-500' },
    { dept: 'Cardiology', time: '18m', percent: 65, color: 'bg-blue-500' },
    { dept: 'General Practice', time: '15m', percent: 55, color: 'bg-blue-600' },
    { dept: 'Radiology', time: '7m', percent: 25, color: 'bg-emerald-400' },
  ];

  const revenueChartData = statsData?.revenueData || [40, 65, 55, 75, 90, 80];

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading Analytics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Comprehensive overview of facility performance and patient health trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all duration-300 font-bold shadow-sm">
            <Download size={18} />
            <span className="tracking-wide text-xs">Download PDF</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 font-bold shadow-lg shadow-blue-600/20">
            <FileSpreadsheet size={18} />
            <span className="tracking-wide text-xs">Export Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 ${stat.trendColor || 'text-emerald-500'}`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Revenue Performance Chart Placeholder */}
        <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Revenue Performance</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100">
              Last 6 Months <ChevronDown size={14} />
            </button>
          </div>
          <div className="h-[300px] w-full flex items-end justify-between relative px-4">
            <div className="absolute inset-x-0 bottom-0 h-px bg-slate-100"></div>
            {revenueChartData.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-4 w-full">
                <div 
                  className="w-1/2 bg-blue-600 rounded-t-xl transition-all duration-1000 ease-out hover:bg-blue-500 cursor-pointer relative group"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                    ${h * 10}k
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wait Times by Dept */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Wait Times by Dept</h3>
          <div className="space-y-8">
            {waitTimes.map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-600">{item.dept}</span>
                  <span className="text-sm font-bold text-slate-800">{item.time}</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
