import React, { useState, useEffect } from 'react';
import StatsCard from '../../common/components/StatsCard';
import { getAdminStats } from '../../../api/statsApi';
import { getDoctors } from '../../../api/doctorApi';
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit2
} from 'lucide-react';

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, doctorsRes] = await Promise.all([
          getAdminStats(),
          getDoctors()
        ]);
        setStatsData(statsRes.data.stats);
        setStaffData(doctorsRes.data.doctors.slice(0, 5)); // Show top 5
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      title: 'إجمالي المرضى',
      value: statsData?.totalPatients?.toLocaleString() || '0',
      icon: Users,
      trend: 'up',
      trendValue: '+0%',
      secondaryText: 'بيانات في الوقت الفعلي'
    },
    {
      title: 'الإيرادات الشهرية',
      value: `$${statsData?.monthlyRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      trend: 'up',
      trendValue: '+0%',
      secondaryText: 'الإيرادات المقدرة',
      variant: 'emerald'
    },
    {
      title: 'حجم المواعيد',
      value: statsData?.totalAppointments?.toLocaleString() || '0',
      icon: Calendar,
      trend: 'up',
      trendValue: '+0%',
      secondaryText: 'إجمالي الحجوزات',
      variant: 'rose'
    },
  ];

  const alerts = [
    { title: 'صيانة المعدات الحرجة', desc: 'جهاز التصوير بالرنين المغناطيسي ٢ يحتاج إلى معايرة فورية.', time: 'منذ ١٠ دقائق', type: 'critical', icon: AlertTriangle },
    { title: 'تسجيلات جديدة معلقة', desc: '١٥ تسجيل مريض جديد بانتظار الموافقة.', time: 'منذ ساعة', type: 'info', icon: Users },
    { title: 'تحديث النظام ناجح', desc: 'اكتملت مزامنة قاعدة بيانات السجلات الطبية بدون أخطاء.', time: 'منذ ٣ ساعات', type: 'success', icon: CheckCircle2 },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center px-4 py-12 text-center font-bold text-slate-500">
        جاري تحميل بيانات لوحة التحكم...
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div className="admin-section min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">إحصائيات المستشفى</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 sm:text-lg">نظرة عامة على العمليات والمقاييس الحالية للمستشفى.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <div key={i} className="stats-card">
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 xl:gap-8">
        {/* Staff Management */}
        <div className="admin-section rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8 xl:col-span-2">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center">
            <h3 className="text-xl font-bold text-slate-800">إدارة الموظفين</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
              عرض الكل <ChevronRight size={14} className="rotate-180" />
            </button>
          </div>
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[520px] border-collapse text-right">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">الطبيب</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">القسم</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الحالة</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staffData.map((s, i) => (
                  <tr key={i} className="group">
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {s.user?.name?.substring(0, 3).toUpperCase() || 'DOC'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{s.user?.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{s.specialty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-center text-sm font-medium text-slate-600">{s.specialty}</td>
                    <td className="py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {s.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="py-5 text-left">
                      <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="admin-section rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
          <h3 className="mb-6 text-lg font-bold text-slate-800 sm:mb-8 sm:text-xl">التنبيهات والإشعارات</h3>
          <div className="space-y-6 sm:space-y-8">
            {alerts.map((alert, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div className={`p-3 rounded-2xl h-fit transition-colors ${alert.type === 'critical' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' :
                    alert.type === 'success' ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' :
                      'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
                  }`}>
                  <alert.icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">{alert.title}</h4>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">{alert.desc}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
