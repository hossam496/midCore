import React, { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Search,
  Bell,
  MessageSquare,
  MoreVertical,
  ArrowUpRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import gsap from 'gsap';

// Sidebar Component
const DoctorSidebar = () => {
  const sidebarRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(sidebarRef.current,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', active: true },
    { icon: Users, label: 'المرضى' },
    { icon: Calendar, label: 'المواعيد' },
    { icon: FileText, label: 'التقارير' },
    { icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <div ref={sidebarRef} className="w-72 h-screen bg-[#0f172a] text-white flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-black text-xl">م</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">ميدكور</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${item.active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-slate-800">
        <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-2xl">
          <img src="https://i.pravatar.cc/150?u=dr" alt="Doctor" className="w-10 h-10 rounded-xl border border-slate-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Dr. Sarah Johnson</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cardiologist</p>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
        <button className="w-full flex items-center gap-4 px-4 py-4 mt-4 text-red-400 hover:text-red-300 font-bold text-sm transition-colors">
          <LogOut size={20} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

// Header Component
const DoctorHeader = () => (
  <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40">
    <div className="flex items-center gap-12">
      {/* Dashboard Label with Active Indicator */}
      <div className="flex flex-col">
        <button className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] relative pb-1">
          لوحة التحكم
          <div className="absolute bottom-0 right-0 w-8 h-1 bg-blue-600 rounded-full" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group hidden md:block w-96">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input
          type="text"
          placeholder="ابحث عن المرضى، التقارير، المواعيد..."
          className="w-full pr-12 pl-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium"
        />
      </div>
    </div>

    <div className="flex items-center gap-6">
      <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
        <Bell size={22} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>
      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
        <MessageSquare size={22} />
      </button>
      <div className="h-8 w-px bg-slate-100 mx-2" />
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 cursor-pointer hover:scale-105 transition-transform">
        SJ
      </div>
    </div>
  </header>
);

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, trend, color }) => (
  <div className="stat-card bg-white p-6 rounded-4xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
    <div className="flex items-center justify-between mb-6">
      <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="flex items-center gap-1 text-green-500 text-xs font-black bg-green-50 px-2 py-1 rounded-lg">
        <ArrowUpRight size={14} />
        {trend}
      </div>
    </div>
    <div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
  </div>
);

const DoctorDashboard = () => {
  const dashboardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".stat-card", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.5
      });
      gsap.from(".content-section", {
        y: 30,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        delay: 0.8
      });
    }, dashboardRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <DoctorSidebar />

      <main className="flex-1 ml-72">
        <DoctorHeader />

        <div ref={dashboardRef} className="p-10 space-y-10">

          {/* Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard
              label="مرضى اليوم"
              value="24"
              icon={Users}
              trend="+12%"
              color="bg-blue-600"
            />
            <StatCard
              label="تقارير معلقة"
              value="08"
              icon={FileText}
              trend="مستقر"
              color="bg-orange-500"
            />
            <StatCard
              label="استشارات أسبوعية"
              value="156"
              icon={Calendar}
              trend="+5%"
              color="bg-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Timeline Section */}
            <div className="lg:col-span-4 content-section space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">جدول اليوم</h2>
                <button className="text-xs font-bold text-blue-600 hover:underline">عرض الكل</button>
              </div>

              <div className="space-y-4">
                {/* Active Appointment */}
                <div className="bg-blue-600 rounded-4xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                  <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                    <Clock size={12} /> قيد التنفيذ
                  </div>
                  <h4 className="text-xl font-bold mb-1">Johnathan Doe</h4>
                  <p className="text-sm opacity-80 mb-6 italic">فحص عام - أمراض القلب</p>
                  <button className="w-full py-3.5 bg-white text-blue-600 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all">
                    الدخول للاستشارة
                    <ExternalLink size={16} />
                  </button>
                </div>

                {/* Upcoming */}
                {[
                  { name: 'Sarah Miller', time: '02:30 PM', type: 'متابعة' },
                  { name: 'Michael Brown', time: '04:00 PM', type: 'مراجعة تحاليل' }
                ].map((apt) => (
                  <div key={apt.name} className="bg-white p-6 rounded-4xl border border-slate-100 flex items-center gap-4 hover:border-blue-200 transition-all group">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-blue-600">{apt.time.split(' ')[0]}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{apt.time.split(' ')[1]}</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-900">{apt.name}</h5>
                      <p className="text-xs font-bold text-slate-400">{apt.type}</p>
                    </div>
                    <button className="p-2 text-slate-300 group-hover:text-blue-600 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Section */}
            <div className="lg:col-span-8 content-section space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">أحدث المرضى</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">الكل</button>
                  <button className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-200 transition-all">جديد</button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">المعرف</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الاسم</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الزيارة الأخيرة</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-left">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { id: 'PT-9021', name: 'Emily Wilson', date: '١٠ مايو ٢٠٢٦', status: 'مكتمل', color: 'text-green-600 bg-green-50' },
                        { id: 'PT-9025', name: 'Robert Fox', date: '١٠ مايو ٢٠٢٦', status: 'قيد الانتظار', color: 'text-orange-600 bg-orange-50' },
                        { id: 'PT-9030', name: 'Lisa Smith', date: '٠٩ مايو ٢٠٢٦', status: 'مكتمل', color: 'text-green-600 bg-green-50' },
                        { id: 'PT-9034', name: 'David Lee', date: '٠٨ مايو ٢٠٢٦', status: 'ملغي', color: 'text-red-600 bg-red-50' }
                      ].map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">{patient.id}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-[10px] font-black uppercase">
                                {patient.name.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-slate-900">{patient.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">{patient.date}</td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${patient.color}`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-left">
                            <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                              <ArrowUpRight size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                  <button className="text-sm font-bold text-blue-600 hover:underline">عرض كل المرضى</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
