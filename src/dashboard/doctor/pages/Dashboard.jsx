import React, { useState, useEffect } from 'react';
import StatsCard from '../../common/components/StatsCard';
import AppointmentTimeline from '../components/AppointmentTimeline';
import RecentPatients from '../components/RecentPatients';
import { Users, FileText, Activity } from 'lucide-react';
import { getDoctorStats } from '../../../api/statsApi';
import { getAppointments } from '../../../api/appointmentApi';
import { useAuth } from '../../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [statsRes, appointmentsRes] = await Promise.all([
          getDoctorStats(),
          getAppointments()
        ]);

        setStatsData(statsRes.data.stats);
        setAppointments(appointmentsRes.data.appointments);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Helper to format appointment count into correct Arabic grammatical rules (مفرد، مثنى، جمع)
  const getAppointmentText = (count) => {
    if (!count || count === 0) return 'ليس لديك أي مواعيد مجدولة اليوم.';
    if (count === 1) return 'لديك موعد واحد مجدول اليوم.';
    if (count === 2) return 'لديك موعدان مجدولان اليوم.';
    if (count >= 3 && count <= 10) return `لديك ${count} مواعيد مجدولة اليوم.`;
    return `لديك ${count} موعداً مجدولاً اليوم.`;
  };

  const stats = [
    { 
      title: 'مرضى اليوم', 
      value: statsData?.todayPatients?.toString() || '0', 
      icon: Users, 
      trend: 'up', 
      trendValue: '+0', 
      secondaryText: 'مجدولين لليوم' 
    },
    { 
      title: 'تقارير معلقة', 
      value: statsData?.pendingReports?.toString() || '0', 
      icon: FileText, 
      secondaryText: 'تتطلب المراجعة والاعتماد',
      warning: true 
    },
    { 
      title: 'الاستشارات الأسبوعية', 
      value: statsData?.weeklyConsultations?.toString() || '42', 
      icon: Activity, 
      secondaryText: 'الهدف: 60 استشارة أسبوعياً', 
      progress: statsData?.weeklyConsultations ? Math.min(100, Math.round((statsData.weeklyConsultations / 60) * 100)) : 70, 
      variant: 'blue' 
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-16 text-center font-bold text-slate-500 font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-650 border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  const doctorName = user?.name ? user.name.replace(/^(dr\.|dr|الدكتور|د\.)\s*/i, '') : '';

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10 max-w-[1600px] mx-auto min-w-0" dir="rtl">
      {/* Welcome Title Banner */}
      <div className="min-w-0 text-right">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-850 sm:text-3xl lg:text-4xl">
          أهلاً بك، د. {doctorName || 'حسام'}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-500 font-bold text-sm sm:text-base leading-relaxed">
          إليك نظرة عامة على نشاطك وجدول أعمالك اليوم. {getAppointmentText(statsData?.todayPatients || 0)}
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <div key={i} className="stats-card-wrapper">
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Timeline and Recent Patients Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="min-w-0 lg:col-span-2 content-section">
          <AppointmentTimeline appointments={appointments} />
        </div>
        <div className="content-section">
          <RecentPatients appointments={appointments} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
