import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  AlertCircle,
  Users,
  Activity,
  UserCheck,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAppointments } from '../../../api/appointmentApi';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getAppointments();
        const appts = res.data.appointments;

        // Extract unique patients from appointments
        const uniquePatientsMap = new Map();
        appts.forEach(apt => {
          if (apt.patient && !uniquePatientsMap.has(apt.patient._id)) {
            uniquePatientsMap.set(apt.patient._id, {
              ...apt.patient,
              lastVisit: new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: 'Active', // Mocking status since there is no status in User model
            });
          }
        });

        setPatients(Array.from(uniquePatientsMap.values()));
      } catch (err) {
        console.error('Failed to fetch patients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const stats = [
    {
      label: 'TOTAL PATIENTS',
      value: patients.length.toString(),
      change: 'All-time',
      icon: Users,
      color: 'blue',
      bg: 'bg-blue-600/10',
      text: 'text-blue-600'
    },
    {
      label: 'CURRENTLY ACTIVE',
      value: patients.length.toString(),
      change: 'Active',
      icon: UserCheck,
      color: 'emerald',
      bg: 'bg-emerald-600/10',
      text: 'text-emerald-600'
    },
    {
      label: 'CRITICAL CARE',
      value: '0',
      change: 'Priority',
      icon: AlertCircle,
      color: 'rose',
      bg: 'bg-rose-600/10',
      text: 'text-rose-600'
    },
    {
      label: 'SCHEDULED VISITS',
      value: patients.length.toString(),
      change: 'Today',
      icon: Calendar,
      color: 'indigo',
      bg: 'bg-indigo-600/10',
      text: 'text-indigo-600'
    }
  ];

  if (loading) {
    return <div className="p-8 text-center font-bold text-slate-500">Loading Patients...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 page-header">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patients Directory</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Manage and monitor patient health records and histories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all duration-300 font-bold shadow-sm">
            <Filter size={18} />
            <span className="tracking-wide uppercase text-[10px]">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all duration-300 font-bold shadow-sm">
            <Download size={18} />
            <span className="tracking-wide uppercase text-[10px]">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="stat-card bg-white border border-slate-100 p-6 rounded-2xl hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.text}`}>
                <stat.icon size={22} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.text}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div
        className="patients-table bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Patient ID</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Phone</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Visit</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map((patient, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center font-bold text-slate-400">
                          {patient.name?.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${patient.status === 'Active' ? 'bg-emerald-500' :
                          patient.status === 'Critical' ? 'bg-rose-500' : 'bg-slate-400'
                          }`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{patient.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{patient.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">
                      #{patient._id.substring(0, 6).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-600">{patient.phone || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{patient.lastVisit}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${patient.status === 'Active'
                      ? 'bg-emerald-600/10 text-emerald-600'
                      : patient.status === 'Critical'
                        ? 'bg-rose-600/10 text-rose-600'
                        : 'bg-slate-200 text-slate-500'
                      }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/doctor/patients/${patient._id}`}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;


