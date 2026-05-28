import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  User as UserIcon,
  MapPin,
  Calendar as CalendarIcon,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  Activity,
  Smile,
  X,
  Phone,
  MessageSquare,
  Eye,
  AlertCircle,
  FileText,
  UserPlus,
  RefreshCw,
  Video
} from 'lucide-react';
import { 
  getAppointments, 
  updateAppointmentStatus, 
  getAvailableSlots,
  createAppointment,
  updateAppointment
} from '../../../api/appointmentApi';
import { getMyDoctorProfile, toggleBlockSlot } from '../../../api/doctorApi';
import { getPatients } from '../../../api/userApi';
import SmartCalendar from '../../../components/calendar/SmartCalendar';
import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const Schedule = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  
  // Tab and date states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('appointments'); // appointments | availability
  
  // Available slots for selected day (availability tab)
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Quick Add Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  // New patient form data
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'male'
  });
  
  // Booking parameters
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availableBookingSlots, setAvailableBookingSlots] = useState([]);
  const [slotsLoadingModal, setSlotsLoadingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingReason, setBookingReason] = useState('');
  const [bookingType, setBookingType] = useState('clinic'); // clinic | virtual
  const [bookingNotes, setBookingNotes] = useState('');

  // Fetch initial profile and appointments
  const fetchDoctorAndAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const [apptRes, doctorRes] = await Promise.all([
        getAppointments(),
        getMyDoctorProfile()
      ]);
      setAppointments(apptRes.data.appointments);
      setDoctor(doctorRes.data.doctor);
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch slots for availability tab
  const fetchAvailabilitySlots = useCallback(async () => {
    if (!doctor) return;
    try {
      setSlotsLoading(true);
      const res = await getAvailableSlots(doctor._id, format(selectedDate, 'yyyy-MM-dd'));
      setSlots(res.data.slots);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctor, selectedDate]);

  useEffect(() => {
    fetchDoctorAndAppointments();
  }, [fetchDoctorAndAppointments]);

  useEffect(() => {
    fetchAvailabilitySlots();
  }, [fetchAvailabilitySlots]);

  // Load patients directory when modal is opened
  useEffect(() => {
    if (isModalOpen) {
      const fetchPatientsData = async () => {
        try {
          setPatientsLoading(true);
          const res = await getPatients();
          setPatients(res.data.users || []);
        } catch (err) {
          console.error('Failed to load patients', err);
        } finally {
          setPatientsLoading(false);
        }
      };
      fetchPatientsData();
    }
  }, [isModalOpen]);

  // Fetch available slots for the modal date picker
  useEffect(() => {
    if (isModalOpen && doctor && bookingDate) {
      const fetchBookingSlots = async () => {
        try {
          setSlotsLoadingModal(true);
          const res = await getAvailableSlots(doctor._id, bookingDate);
          setAvailableBookingSlots(res.data.slots || []);
          setSelectedTimeSlot(null); // Reset selected slot
        } catch (err) {
          console.error('Failed to load slots for modal', err);
        } finally {
          setSlotsLoadingModal(false);
        }
      };
      fetchBookingSlots();
    }
  }, [isModalOpen, doctor, bookingDate]);

  // Handle blocking/unblocking a time slot (for doctor scheduling control)
  const handleToggleBlock = async (startTime) => {
    try {
      await toggleBlockSlot({
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime
      });
      fetchAvailabilitySlots();
      toast.success('تم تحديث حالة الفترة بنجاح');
    } catch (err) {
      Swal.fire('خطأ', 'فشل في تحديث حالة الفترة.', 'error');
    }
  };

  // Handle status transitions (Confirm, Complete, Cancel)
  const handleStatusChange = async (id, status) => {
    try {
      let titleAr = '';
      let textAr = '';
      if (status === 'confirmed') {
        titleAr = 'تأكيد الموعد';
        textAr = 'هل أنت متأكد من رغبتك في تأكيد هذا الموعد؟';
      } else if (status === 'completed') {
        titleAr = 'إكمال الموعد';
        textAr = 'هل تم الانتهاء من الكشف الطبي وإكمال الموعد بنجاح؟';
      } else if (status === 'cancelled') {
        titleAr = 'إلغاء الموعد';
        textAr = 'هل تريد بالتأكيد إلغاء هذا الموعد؟ سيتم إشعار المريض.';
      }

      const result = await Swal.fire({
        title: titleAr,
        text: textAr,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: status === 'cancelled' ? '#ef4444' : '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'نعم، تابع',
        cancelButtonText: 'إلغاء'
      });

      if (result.isConfirmed) {
        await updateAppointmentStatus(id, status);
        fetchDoctorAndAppointments();
        toast.success('تم تحديث حالة الموعد');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('فشل في تحديث حالة الموعد');
    }
  };

  // Perform Manual Booking Submission
  const handleManualBooking = async (e) => {
    e.preventDefault();
    if (!doctor) return;
    
    if (!isNewPatient && !selectedPatient) {
      toast.error('الرجاء اختيار مريض أو تفعيل إضافة مريض جديد');
      return;
    }
    
    if (isNewPatient && !newPatientData.name) {
      toast.error('الرجاء إدخال اسم المريض');
      return;
    }
    
    if (!selectedTimeSlot) {
      toast.error('الرجاء اختيار وقت الموعد');
      return;
    }

    try {
      const payload = {
        doctorId: doctor._id,
        date: bookingDate,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        reason: bookingReason || 'كشف طبي يدوي',
        bookingType,
        notes: bookingNotes
      };

      if (isNewPatient) {
        payload.patientDetails = {
          name: newPatientData.name,
          phone: newPatientData.phone,
          email: newPatientData.email || undefined,
          age: newPatientData.age ? parseInt(newPatientData.age) : undefined,
          gender: newPatientData.gender
        };
      } else {
        payload.patientId = selectedPatient._id;
        payload.patientDetails = {
          name: selectedPatient.name,
          phone: selectedPatient.phone,
          email: selectedPatient.email,
        };
      }

      await createAppointment(payload);
      toast.success('تم حجز الموعد بنجاح');
      setIsModalOpen(false);
      
      // Reset forms
      setSelectedPatient(null);
      setPatientSearch('');
      setIsNewPatient(false);
      setNewPatientData({ name: '', phone: '', email: '', age: '', gender: 'male' });
      setBookingReason('');
      setBookingNotes('');
      setSelectedTimeSlot(null);

      // Refresh appointments
      fetchDoctorAndAppointments();
    } catch (err) {
      console.error('Error creating manual booking:', err);
      const errMsg = err.response?.data?.message || 'حدث خطأ أثناء حفظ الحجز';
      Swal.fire('فشل في الحجز', errMsg, 'error');
    }
  };

  // Status Styles mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'confirmed': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-rose-700 bg-rose-50 border-rose-200';
      default: return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  // Stats derivation
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  
  const todayAppointments = appointments.filter(a => 
    format(new Date(a.date), 'yyyy-MM-dd') === todayDateStr
  );
  
  const totalTodayCount = todayAppointments.length;
  
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  
  const confirmedTodayCount = todayAppointments.filter(a => a.status === 'confirmed').length;
  
  const completedTodayCount = todayAppointments.filter(a => a.status === 'completed').length;
  
  const todayRevenue = todayAppointments
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  const completionRate = totalTodayCount > 0 
    ? Math.round((completedTodayCount / totalTodayCount) * 100) 
    : 100;

  // Filtered Appointments list (shown on timeline or search list)
  const filteredAppts = appointments.filter(apt => {
    // 1. Filter by Date (Timeline sidebar displays selectedDate schedule)
    const apptDateStr = format(new Date(apt.date), 'yyyy-MM-dd');
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const matchesDate = apptDateStr === selectedDateStr;

    // 2. Filter by Search Query (Patient name)
    const patientName = apt.patientDetails?.name || apt.patient?.name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase());

    // 3. Filter by Status
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

    // 4. Filter by Type
    const matchesType = typeFilter === 'all' || apt.bookingType === typeFilter;

    return matchesDate && matchesSearch && matchesStatus && matchesType;
  });

  // Filtered Patients List for modal autocomplete
  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch) ||
    p.email?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة المواعيد والجدول</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">عرض وتنظيم مواعيد المرضى والجدول الزمني الطبي بدقة واحترافية</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Glowing Manual Booking Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-sm shadow-blue-500/10 transform hover:-translate-y-0.5 pointer-events-auto cursor-pointer"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>حجز يدوي</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="p-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Statistics Section (5 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">حجوزات اليوم</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">
                {totalTodayCount < 10 ? `0${totalTodayCount}` : totalTodayCount}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <CalendarIcon size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400">إجمالي الحجوزات الطبية لليوم</p>
          </div>
        </div>

        {/* Card 2: Pending Confirmation */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">طلبات معلقة</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">
                {pendingCount < 10 ? `0${pendingCount}` : pendingCount}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400">بانتظار الموافقة والتأكيد</p>
          </div>
        </div>

        {/* Card 3: Confirmed Today */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">مؤكدة اليوم</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">
                {confirmedTodayCount < 10 ? `0${confirmedTodayCount}` : confirmedTodayCount}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400">مواعيد مؤكدة قيد التنفيذ</p>
          </div>
        </div>

        {/* Card 4: Revenue Today */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">دخل اليوم المقدر</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight truncate">
                {todayRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-400">ريال</span>
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400">إيرادات الجلسات المؤكدة</p>
          </div>
        </div>

        {/* Card 5: Completion Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">معدل الإكمال</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">
                {completionRate}%
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400">نسبة المرضى الذين تم الكشف عليهم</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="ابحث عن مريض..."
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
              <option value="all">كل الحالات</option>
              <option value="pending">معلق (Pending)</option>
              <option value="confirmed">مؤكد (Confirmed)</option>
              <option value="completed">مكتمل (Completed)</option>
              <option value="cancelled">ملغي (Cancelled)</option>
            </select>
          </div>

          {/* Type Filters */}
          <div className="relative w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">كل أنواع الكشف</option>
              <option value="clinic">زيارة للعيادة</option>
              <option value="virtual">استشارة مرئية</option>
            </select>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Span: Calendar Grid */}
        <div className="lg:col-span-8 space-y-8">
          <SmartCalendar
            appointments={appointments}
            onDateSelect={setSelectedDate}
            loading={loading}
            onAppointmentUpdate={fetchDoctorAndAppointments}
          />
        </div>

        {/* Right Span: Day Agenda Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full min-h-[640px] max-h-[750px] overflow-hidden sticky top-6">
            {/* Header Details Panel */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">أجندة المواعيد</h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">تفاصيل الحجوزات لليوم المحدد</p>
                </div>
                
                {/* View/Availability Tab toggle */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                      activeTab === 'appointments' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    الحجوزات
                  </button>
                  <button
                    onClick={() => setActiveTab('availability')}
                    className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                      activeTab === 'availability' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    الساعات المتاحة
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3.5 py-2.5 rounded-2xl border border-blue-100/50">
                <CalendarIcon size={14} />
                <span className="text-xs font-bold">
                  {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </span>
              </div>
            </div>

            {/* Scrolling list section */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {activeTab === 'appointments' ? (
                filteredAppts.length === 0 ? (
                  // Custom Empty States Illustration
                  <div className="flex flex-col items-center justify-center h-80 text-center px-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 border border-blue-100">
                      <Smile className="text-blue-600" size={38} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">لا توجد مواعيد مجدولة</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                      لم يتم تسجيل أي حجوزات نشطة أو مطابقة في هذا التاريخ.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                    >
                      <Plus size={14} />
                      <span>حجز موعد الآن</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 relative border-r-2 border-slate-100 pr-4 mr-2">
                    {filteredAppts.map((apt) => {
                      const patientName = apt.patientDetails?.name || apt.patient?.name || 'مريض غير معروف';
                      const initials = patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      const hasPhone = apt.patientDetails?.phone || apt.patient?.phone;

                      return (
                        <div key={apt._id} className="relative group/card">
                          {/* Timeline dot */}
                          <div className={`absolute -right-[23px] top-3.5 w-3.5 h-3.5 rounded-full border-4 border-white z-10 shadow-sm
                            ${apt.status === 'completed' ? 'bg-emerald-500' : 
                              apt.status === 'confirmed' ? 'bg-blue-500' : 
                              apt.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'}`}
                          ></div>
                          
                          {/* Rich Appointment Details Card */}
                          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl group-hover/card:bg-white group-hover/card:shadow-xl group-hover/card:border-blue-100 transition-all duration-300">
                            
                            {/* Top header */}
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-extrabold text-slate-800 truncate">
                                    {patientName}
                                  </h4>
                                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                                    رقم الموعد: #{apt.appointmentNumber || '0'}
                                  </span>
                                </div>
                              </div>

                              <div className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${getStatusColor(apt.status)}`}>
                                {apt.status}
                              </div>
                            </div>

                            {/* Middle data */}
                            <div className="space-y-1.5 py-2.5 border-y border-slate-100 my-2 text-[11px] text-slate-600 font-semibold">
                              <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-400 shrink-0" />
                                <span>{apt.startTime} - {apt.endTime}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {apt.bookingType === 'virtual' ? (
                                  <>
                                    <Video size={12} className="text-indigo-500 shrink-0" />
                                    <span>استشارة مرئية عبر الإنترنت</span>
                                  </>
                                ) : (
                                  <>
                                    <MapPin size={12} className="text-emerald-500 shrink-0" />
                                    <span>زيارة حضورية بالعيادة</span>
                                  </>
                                )}
                              </div>

                              {hasPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone size={12} className="text-slate-400 shrink-0" />
                                  <span className="font-mono">{apt.patientDetails?.phone || apt.patient?.phone}</span>
                                </div>
                              )}
                            </div>

                            {/* Reason Notes preview */}
                            {apt.reason && (
                              <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-xl border border-slate-200/20 mb-3 line-clamp-2">
                                <span className="font-bold text-[9px] block text-slate-400 mb-0.5">ملاحظات العيادة:</span>
                                {apt.reason}
                              </div>
                            )}

                            {/* Quick Actions Panel */}
                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100/50">
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'تفاصيل الموعد',
                                      html: `
                                        <div class="text-right space-y-3 p-2 font-cairo">
                                          <p><strong>اسم المريض:</strong> ${patientName}</p>
                                          <p><strong>البريد الإلكتروني:</strong> ${apt.patientDetails?.email || apt.patient?.email || 'غير متوفر'}</p>
                                          <p><strong>الهاتف:</strong> ${apt.patientDetails?.phone || apt.patient?.phone || 'غير متوفر'}</p>
                                          <p><strong>التاريخ:</strong> ${format(new Date(apt.date), 'dd/MM/yyyy')}</p>
                                          <p><strong>الوقت:</strong> ${apt.startTime} - ${apt.endTime}</p>
                                          <p><strong>النوع:</strong> ${apt.bookingType === 'virtual' ? 'استشارة مرئية' : 'كشف في العيادة'}</p>
                                          <p><strong>المبلغ المدفوع:</strong> ${apt.totalAmount || 0} ريال</p>
                                          <p><strong>الحالة:</strong> ${apt.status}</p>
                                          <p><strong>السبب/الملاحظات:</strong> ${apt.reason || 'لا يوجد'}</p>
                                        </div>
                                      `,
                                      confirmButtonText: 'إغلاق',
                                      confirmButtonColor: '#3b82f6',
                                    });
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                  title="عرض التفاصيل"
                                >
                                  <Eye size={13} />
                                </button>
                                
                                <button 
                                  onClick={() => navigate('/doctor/messages')}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                  title="إرسال رسالة"
                                >
                                  <MessageSquare size={13} />
                                </button>
                              </div>

                              <div className="flex gap-1.5">
                                {apt.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleStatusChange(apt._id, 'confirmed')}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                                    >
                                      تأكيد
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(apt._id, 'cancelled')}
                                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                    >
                                      إلغاء
                                    </button>
                                  </>
                                )}

                                {apt.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleStatusChange(apt._id, 'completed')}
                                    className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                                  >
                                    إكمال الموعد
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                // Availability settings tab list
                <div className="space-y-4">
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-400">لا توجد ساعات عمل مدخلة لهذا اليوم</p>
                    </div>
                  ) : (
                    slots.map((slot) => (
                      <div key={slot.start} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white border-l-4 border-l-blue-500">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{slot.start} - {slot.end}</p>
                          <p className={`text-[10px] font-bold mt-1 ${
                            slot.status === 'available' ? 'text-emerald-500' : 
                            slot.status === 'booked' ? 'text-blue-500' : 'text-slate-400'
                          }`}>
                            {slot.status === 'available' ? 'متاح للاستقبال' : 
                              slot.status === 'booked' ? 'محجوز لزيارة مريض' : 'محظور من قبلك'}
                          </p>
                        </div>
                        {slot.status !== 'booked' && (
                          <button
                            onClick={() => handleToggleBlock(slot.start)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                              slot.status === 'blocked' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-white border border-slate-200 text-rose-500 hover:bg-rose-50'
                            }`}
                          >
                            {slot.status === 'blocked' ? 'إلغاء الحظر' : 'حظر الموعد'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Quick Add Appointment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide font-cairo text-right"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">إضافة موعد كشف جديد</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">تسجيل حجز يدوي لمريض في العيادة أو افتراضي</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleManualBooking} className="p-6 space-y-6">
                
                {/* Patient lookup options */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">بيانات المريض</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewPatient(!isNewPatient);
                        setSelectedPatient(null);
                        setPatientSearch('');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      {isNewPatient ? 'اختر مريض مسجل' : 'إضافة مريض جديد'}
                    </button>
                  </div>

                  {!isNewPatient ? (
                    // Autocomplete existing patient search
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="ابحث بالاسم، الهاتف أو البريد..."
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value);
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          className="pl-4 pr-10 py-3 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Dropdown patients list */}
                      {isDropdownOpen && patientSearch.trim() && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {patientsLoading ? (
                            <div className="p-4 text-center text-xs text-slate-400">جاري البحث عن المرضى...</div>
                          ) : filteredPatients.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                              <span>لا توجد نتائج مطابقة</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNewPatient(true);
                                  setNewPatientData({ ...newPatientData, name: patientSearch });
                                  setIsDropdownOpen(false);
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                              >
                                إنشاء حساب جديد لهذا المريض
                              </button>
                            </div>
                          ) : (
                            filteredPatients.map(p => (
                              <div
                                key={p._id}
                                onClick={() => {
                                  setSelectedPatient(p);
                                  setPatientSearch(p.name);
                                  setIsDropdownOpen(false);
                                }}
                                className="flex justify-between items-center p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{p.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{p.email} | {p.phone || 'بدون هاتف'}</p>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                  #{p._id.substring(0, 6).toUpperCase()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      
                      {selectedPatient && (
                        <div className="mt-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/40 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-blue-700">تم اختيار: {selectedPatient.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{selectedPatient.email}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setSelectedPatient(null)}
                            className="p-1 bg-white text-slate-400 hover:text-slate-600 rounded-lg shadow-sm border border-slate-200/50 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // New Patient Registration form
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">الاسم الثلاثي للمريض *</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: محمد أحمد العتيبي"
                          value={newPatientData.name}
                          onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                          className="px-3.5 py-2.5 w-full bg-white border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">رقم الهاتف *</label>
                        <input
                          type="tel"
                          required
                          placeholder="05xxxxxxx"
                          value={newPatientData.phone}
                          onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                          className="px-3.5 py-2.5 w-full bg-white border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none text-left font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">البريد الإلكتروني (اختياري)</label>
                        <input
                          type="email"
                          placeholder="patient@email.com"
                          value={newPatientData.email}
                          onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                          className="px-3.5 py-2.5 w-full bg-white border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none text-left font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">العمر</label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            placeholder="مثال: 32"
                            value={newPatientData.age}
                            onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                            className="px-3.5 py-2.5 w-full bg-white border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none text-center"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">الجنس</label>
                          <select
                            value={newPatientData.gender}
                            onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                            className="px-3.5 py-2.5 w-full bg-white border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                          >
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date & Booking Type Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">تاريخ الكشف</label>
                    <input
                      type="date"
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">نوع الكشف</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setBookingType('clinic')}
                        className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          bookingType === 'clinic' 
                            ? 'bg-white text-blue-600 shadow-sm border border-black/5' 
                            : 'text-slate-400'
                        }`}
                      >
                        <MapPin size={12} />
                        <span>في العيادة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('virtual')}
                        className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          bookingType === 'virtual' 
                            ? 'bg-white text-blue-600 shadow-sm border border-black/5' 
                            : 'text-slate-400'
                        }`}
                      >
                        <Video size={12} />
                        <span>عبر الإنترنت</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Slots Selectors */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">الفترة الزمنية المتاحة</label>
                  
                  {slotsLoadingModal ? (
                    <div className="flex justify-center p-6 border border-dashed border-slate-200 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : availableBookingSlots.length === 0 ? (
                    <div className="p-6 text-center text-xs text-rose-500 bg-rose-50/50 border border-rose-100/50 rounded-2xl">
                      عذراً، لا تتوفر أي فترات حجز شاغرة في هذا التاريخ. الرجاء اختيار يوم آخر.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50/40">
                      {availableBookingSlots.map(s => {
                        const isBooked = s.status === 'booked';
                        const isBlocked = s.status === 'blocked';
                        const isSelected = selectedTimeSlot?.start === s.start;

                        return (
                          <button
                            key={s.start}
                            type="button"
                            disabled={isBooked || isBlocked}
                            onClick={() => setSelectedTimeSlot(s)}
                            className={`py-2 text-center text-[10px] font-extrabold rounded-xl border transition-all duration-200 cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.05]' 
                                : isBooked 
                                  ? 'bg-blue-50/30 border-blue-50/10 text-blue-300 cursor-not-allowed' 
                                  : isBlocked 
                                    ? 'bg-slate-100/60 border-slate-100/30 text-slate-300 cursor-not-allowed' 
                                    : 'bg-white hover:bg-blue-50/50 border-slate-200/60 text-slate-700 hover:border-blue-300'
                            }`}
                          >
                            {s.start}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reason & Notes Fields */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">سبب الكشف / الأعراض</label>
                    <input
                      type="text"
                      placeholder="مثال: فحص دوري، آلام في المفاصل..."
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ملاحظات الطبيب الخاصة</label>
                    <textarea
                      placeholder="سجل أي ملاحظات خاصة بالزيارة أو توجيهات للممرضين..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={2}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold focus:outline-none resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    حفظ وتأكيد الموعد
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Schedule;
