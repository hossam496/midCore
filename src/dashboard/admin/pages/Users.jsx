import React, { useState, useEffect } from 'react';
import { getDoctors } from '../../../api/doctorApi';
import { getAdminStats } from '../../../api/statsApi';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal, 
  UserPlus,
  Shield,
  Stethoscope,
  Activity,
  ChevronLeft,
  ChevronRight,
  Printer,
  Users,
  Trash2
} from 'lucide-react';

import RegisterStaffModal from '../components/RegisterStaffModal';
import { deleteDoctor } from '../../../api/doctorApi';

const UsersList = () => {
  const [staffData, setStaffData] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  const fetchData = async () => {
    try {
      const [doctorsRes, statsRes] = await Promise.all([
        getDoctors(),
        getAdminStats()
      ]);
      setStaffData(doctorsRes.data.doctors);
      setFilteredStaff(doctorsRes.data.doctors);
      setStatsData(statsRes.data.stats);
    } catch (err) {
      console.error('Failed to fetch staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = staffData.filter(s => {
      const matchesSearch = 
        s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty = 
        specialtyFilter === 'All' || 
        s.specialty === specialtyFilter || 
        (s.specialties && s.specialties.includes(specialtyFilter));

      return matchesSearch && matchesSpecialty;
    });
    setFilteredStaff(filtered);
  }, [searchQuery, specialtyFilter, staffData]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await deleteDoctor(id);
        fetchData(); // Refresh list
      } catch (err) {
        alert('Failed to delete staff member');
        console.error(err);
      }
    }
  };

  const uniqueSpecialties = ['All', ...new Set(staffData.map(s => s.specialty))];

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading Staff Directory...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <RegisterStaffModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Staff Directory</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Manage and monitor hospital personnel and access roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl shadow-blue-600/20"
        >
          <UserPlus size={20} />
          <span>Register New Staff</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'TOTAL STAFF', value: statsData?.totalDoctors || '0', trend: 'Verified Personnel', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'NEW REGISTRATIONS', value: staffData.length, trend: 'Last 7 days', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'CRITICAL CASES', value: '24', trend: 'High priority attention', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
              <p className={`text-[10px] font-bold mt-1 uppercase ${stat.color === 'text-rose-600' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-600 outline-none hover:bg-slate-100 transition-all cursor-pointer"
              >
                {uniqueSpecialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Displaying {filteredStaff.length} of {staffData.length} personnel</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors">
              <Download size={18} />
            </button>
            <button className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors">
              <Printer size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age/Sex</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specialty</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaff.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                        {s.user?.name?.substring(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.user?.name}</p>
                        <p className="text-[11px] font-medium text-slate-400">{s.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500 font-mono tracking-tighter">#MC-{s._id.substring(18)}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">{s.user?.gender || 'N/A'}</td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-500">{s.specialty}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDelete(s._id, s.user?.name)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Staff"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing 1-5 of 12k personnel</p>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-400"><ChevronLeft size={18} /></button>
            <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-400"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersList;
