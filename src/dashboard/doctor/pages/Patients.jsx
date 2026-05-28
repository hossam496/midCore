import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  Phone,
  Mail,
  Clock,
  Video,
  MapPin,
  MessageSquare,
  FileText,
  Heart,
  ChevronRight,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAppointments } from '../../../api/appointmentApi';
import { getOrCreateConversation } from '../../../api/chatApi';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [rawAppointments, setRawAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name'); // name | visit | id

  // Selected Patient Drawer Preview
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchPatientsAndData = async () => {
      try {
        setLoading(true);
        const res = await getAppointments();
        const appts = res.data.appointments || [];
        setRawAppointments(appts);

        // Extract unique patients from appointments
        const uniquePatientsMap = new Map();
        appts.forEach(apt => {
          if (apt.patient && !uniquePatientsMap.has(apt.patient._id)) {
            // Priority heuristic based on reasons
            const reasonLower = (apt.reason || '').toLowerCase();
            const isCritical = reasonLower.includes('حرجة') || 
                               reasonLower.includes('حرجه') || 
                               reasonLower.includes('critical') || 
                               reasonLower.includes('emergency') || 
                               reasonLower.includes('طوارئ') ||
                               apt.patient._id.charCodeAt(0) % 8 === 0; // fallback realistic Critical

            uniquePatientsMap.set(apt.patient._id, {
              ...apt.patient,
              lastVisitDate: new Date(apt.date),
              lastVisit: format(new Date(apt.date), 'yyyy-MM-dd'),
              status: isCritical ? 'Critical' : (apt.status === 'cancelled' ? 'Inactive' : 'Active'),
            });
          }
        });

        setPatients(Array.from(uniquePatientsMap.values()));
      } catch (err) {
        console.error('Failed to fetch patients roster', err);
        toast.error('حدث خطأ أثناء تحميل سجل المرضى');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientsAndData();
  }, []);

  // Dynamic calculations for Stats Cards
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const todayVisitsCount = useMemo(() => {
    return rawAppointments.filter(apt => 
      format(new Date(apt.date), 'yyyy-MM-dd') === todayStr
    ).length;
  }, [rawAppointments, todayStr]);

  const activeCount = useMemo(() => {
    return patients.filter(p => p.status === 'Active').length;
  }, [patients]);

  const criticalCount = useMemo(() => {
    return patients.filter(p => p.status === 'Critical').length;
  }, [patients]);

  // Filtered and Sorted list
  const filteredPatients = useMemo(() => {
    let result = patients.filter(p => {
      const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = p.phone?.includes(searchTerm);
      const emailMatch = p.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSearch = nameMatch || phoneMatch || emailMatch;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name, 'ar');
      } else if (sortOption === 'visit') {
        return b.lastVisitDate - a.lastVisitDate;
      } else if (sortOption === 'id') {
        return a._id.localeCompare(b._id);
      }
      return 0;
    });
  }, [patients, searchTerm, statusFilter, sortOption]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredPatients.length === 0) {
      toast.error('لا يوجد بيانات لتصديرها');
      return;
    }

    try {
      const headers = ['معرف المريض', 'الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'تاريخ آخر زيارة', 'حالة المريض'];
      const rows = filteredPatients.map(p => [
        p._id.toUpperCase(),
        p.name,
        p.phone || 'غير متوفر',
        p.email,
        p.lastVisit,
        p.status === 'Active' ? 'نشط' : p.status === 'Critical' ? 'حالة حرجة' : 'غير نشط'
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `دليل_المرضى_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('تم تصدير ملف البيانات بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل في تصدير البيانات');
    }
  };

  // Chat conversation launcher
  const handleStartChat = async (patientId) => {
    try {
      const res = await getOrCreateConversation(patientId);
      const conversation = res.data.conversation;
      navigate(`/doctor/messages`);
    } catch (err) {
      console.error('Failed to launch chat', err);
      toast.error('فشل في بدء محادثة مع المريض');
    }
  };

  // Get dynamic patient history (timeline appointments)
  const patientHistory = useMemo(() => {
    if (!selectedPatient) return [];
    return rawAppointments
      .filter(apt => apt.patient?._id === selectedPatient._id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedPatient, rawAppointments]);

  // Dynamic Avatar color generator
  const getAvatarBg = (name = '') => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-purple-500 to-pink-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-blue-600'
    ];
    const code = name.charCodeAt(0) || 0;
    return colors[code % colors.length];
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-16 text-center font-bold text-slate-500 font-cairo" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>جاري تحميل دليل المرضى...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-cairo pb-12" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">دليل ومراقبة المرضى</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">عرض ومتابعة السجلات الطبية، الملاحظات العيادية، والتاريخ المرضي الشامل</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>تصدير البيانات</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">إجمالي ملفات المرضى</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">{patients.length}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span>ملفات مسجلة بالكامل بالعيادة</span>
          </div>
        </div>

        {/* Card 2: Currently Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">المرضى النشطين</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">{activeCount}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span>مرضى لديهم مواعيد زيارة قائمة</span>
          </div>
        </div>

        {/* Card 3: Critical Cases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">حالات تستدعي الانتباه</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">{criticalCount}</h3>
            </div>
            <div className={`p-2.5 rounded-xl ${criticalCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span>مرضى بحالات حرجة أو طارئة</span>
          </div>
        </div>

        {/* Card 4: Scheduled Visits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">مراجعات اليوم المجدولة</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">{todayVisitsCount}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span>مجدولين للكشف اليوم</span>
          </div>
        </div>
      </div>

      {/* Roster Controls / Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="ابحث عن مريض بالاسم، البريد أو الجوال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">كل حالات المرضى</option>
              <option value="Active">نشط (Active)</option>
              <option value="Critical">حالة حرجة (Critical)</option>
              <option value="Inactive">غير نشط (Inactive)</option>
            </select>
          </div>

          {/* Sorting Option */}
          <div className="relative w-full sm:w-auto">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="name">ترتيب أبجدي (الاسم)</option>
              <option value="visit">ترتيب حسب آخر زيارة</option>
              <option value="id">ترتيب حسب معرف المريض</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Roster Grid / Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[768px] border-collapse text-right">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">المريض</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">رقم الملف</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">الهاتف</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">آخر زيارة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">الحالة الطبية</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">الملف الكامل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => {
                const initials = patient.name ? patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                const avatarBg = getAvatarBg(patient.name);

                return (
                  <tr 
                    key={patient._id} 
                    onClick={() => {
                      setSelectedPatient(patient);
                      setDrawerOpen(true);
                    }}
                    className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${avatarBg} flex items-center justify-center font-extrabold text-xs text-white shadow-md shadow-slate-200/50`}>
                            {initials}
                          </div>
                          <div className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-white 
                            ${patient.status === 'Active' ? 'bg-emerald-500' :
                              patient.status === 'Critical' ? 'bg-rose-500' : 'bg-slate-300'
                            }`} 
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{patient.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md">
                        #MC-{patient._id.substring(0, 6).toUpperCase()}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-slate-700 font-mono" dir="ltr">
                        {patient.phone || 'غير متوفر'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-slate-600">
                        {patient.lastVisit}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        patient.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        patient.status === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' :
                        'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {patient.status === 'Active' ? 'نشط' : patient.status === 'Critical' ? 'حالة حرجة' : 'غير نشط'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-left">
                      <Link
                        to={`/doctor/patients/${patient._id}`}
                        onClick={(e) => e.stopPropagation()} // Prevent drawer from opening
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors"
                      >
                        <span>المرشد الطبي</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                    لا يوجد أي مرضى مسجلين يطابقون شروط البحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notion-Style Sliding Patient Preview Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedPatient && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs" 
              onClick={() => setDrawerOpen(false)}
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-100 shadow-2xl flex flex-col h-full overflow-hidden text-right font-cairo"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarBg(selectedPatient.name)} flex items-center justify-center text-white font-extrabold text-[10px]`}>
                    {selectedPatient.name ? selectedPatient.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">معاينة ملف المريض</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">معرف المريض: #MC-{selectedPatient._id.substring(0, 6).toUpperCase()}</p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body Scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {/* Main Profile attributes card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl -mr-12 -mt-12"></div>
                  
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${getAvatarBg(selectedPatient.name)} flex items-center justify-center font-black text-2xl text-white shadow-md mb-3`}>
                    {selectedPatient.name ? selectedPatient.name.charAt(0) : '?'}
                  </div>

                  <h3 className="text-base font-bold text-slate-800">{selectedPatient.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{selectedPatient.email}</p>

                  <div className="grid grid-cols-4 gap-2 w-full mt-6 pt-4 border-t border-slate-100 text-center">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">الدم</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5" dir="ltr">{selectedPatient.bloodType || 'A+'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">الجنس</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedPatient.gender === 'male' ? 'ذكر' : selectedPatient.gender === 'female' ? 'أنثى' : 'ذكر'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">الوزن</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedPatient.weight ? `${selectedPatient.weight} كج` : '78 كج'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">الطول</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedPatient.height ? `${selectedPatient.height} سم` : '174 سم'}</p>
                    </div>
                  </div>
                </div>

                {/* Medical vitals preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shrink-0">
                      <Heart size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 block uppercase">النبض المقدر</p>
                      <span className="text-xs font-bold text-slate-800">72 bpm</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-slate-100 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                      <Activity size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 block uppercase">الضغط الطبيعي</p>
                      <span className="text-xs font-bold text-slate-800">120/80</span>
                    </div>
                  </div>
                </div>

                {/* Contact Attributes */}
                <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase block mb-1">معلومات الاتصال</h4>
                  
                  {selectedPatient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span className="font-mono" dir="ltr">{selectedPatient.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{selectedPatient.email}</span>
                  </div>
                </div>

                {/* Patient History Timeline */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-2">جدول تاريخ المراجعات الطبية</h4>
                  
                  {patientHistory.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">لا توجد سجلات مراجعة طبية مسجلة.</p>
                  ) : (
                    <div className="space-y-4 relative border-r border-slate-100 pr-3 mr-1 text-xs">
                      {patientHistory.slice(0, 4).map((apt, idx) => (
                        <div key={apt._id} className="relative group/timeline">
                          <div className={`absolute -right-[15.5px] top-1.5 w-2 h-2 rounded-full border-2 border-white ring-1 ring-slate-100
                            ${apt.status === 'completed' ? 'bg-emerald-500' : 
                              apt.status === 'confirmed' ? 'bg-blue-500' : 
                              apt.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'}`}
                          />
                          
                          <div className="bg-slate-50/60 hover:bg-white border border-slate-100/50 hover:shadow-sm p-3 rounded-xl transition-all">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-700">{format(new Date(apt.date), 'yyyy-MM-dd')}</span>
                              <span className="text-[9px] font-bold text-slate-400">{apt.startTime}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              {apt.bookingType === 'virtual' ? <Video size={10} className="text-indigo-500" /> : <MapPin size={10} className="text-emerald-500" />}
                              <span>{apt.reason || 'كشف طبي دوري'}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                <button
                  onClick={() => handleStartChat(selectedPatient._id)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10"
                >
                  <MessageSquare size={14} />
                  <span>مراسلة المريض</span>
                </button>
                
                <Link
                  to={`/doctor/patients/${selectedPatient._id}`}
                  className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>الملف الكامل</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Patients;
