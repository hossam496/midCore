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

  const stats = [
    { 
      title: 'PATIENTS TODAY', 
      value: statsData?.todayPatients?.toString() || '0', 
      icon: Users, 
      trend: 'up', 
      trendValue: '+0', 
      secondaryText: 'Scheduled today' 
    },
    { 
      title: 'PENDING REPORTS', 
      value: statsData?.pendingReports?.toString() || '0', 
      icon: FileText, 
      secondaryText: 'Requires review',
      warning: true 
    },
    { 
      title: 'WEEKLY CONSULTATIONS', 
      value: statsData?.weeklyConsultations?.toString() || '42', 
      icon: Activity, 
      secondaryText: 'Target: 60/week', 
      progress: 70, 
      variant: 'blue' 
    },
  ];

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Good morning, Dr. {user?.name ? user.name.split(' ')[0] : ''}</h1>
        <p className="text-slate-500 mt-1 font-medium">Here is your daily overview. You have {statsData?.todayPatients || 0} appointments scheduled today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="stats-card-wrapper">
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 content-section">
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


