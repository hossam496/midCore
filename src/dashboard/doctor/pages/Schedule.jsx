import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { getAppointments, updateAppointmentStatus, getAvailableSlots } from '../../../api/appointmentApi';
import { getMyDoctorProfile, toggleBlockSlot } from '../../../api/doctorApi';
import SmartCalendar from '../../../components/calendar/SmartCalendar';
import { format, isSameDay } from 'date-fns';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const Schedule = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doctor, setDoctor] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');

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
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
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
    fetchSlots();
  }, [fetchSlots]);

  const handleToggleBlock = async (startTime) => {
    try {
      await toggleBlockSlot({
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime
      });
      fetchSlots();
      toast.success('تم تحديث حالة الموعد');
    } catch (err) {
      Swal.fire('خطأ', 'فشل في تحديث حالة الموعد.', 'error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const result = await Swal.fire({
        title: 'تغيير الحالة',
        text: `هل أنت متأكد من تغيير حالة الموعد إلى ${status}؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'نعم، قم بالتغيير',
        cancelButtonText: 'إلغاء'
      });

      if (result.isConfirmed) {
        await updateAppointmentStatus(id, status);
        fetchDoctorAndAppointments();
        Swal.fire('تم التحديث!', 'تم تغيير حالة الموعد بنجاح.', 'success');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      Swal.fire('خطأ', 'فشل في تحديث الحالة.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'confirmed': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  // Filter appointments for selected date
  const filteredAppts = appointments.filter(a => {
    const apptDate = format(new Date(a.date), 'yyyy-MM-dd');
    const targetDate = format(selectedDate, 'yyyy-MM-dd');
    return apptDate === targetDate;
  });

  // Dashboard stats
  const today = new Date();
  const todayApptsCount = appointments.filter(a => isSameDay(new Date(a.date), today)).length;
  const pendingApptsCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة المواعيد والجدول</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">عرض وتنظيم مواعيد المرضى والجدول الزمني الطبي</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
            <Plus size={18} />
            <span>حجز يدوي</span>
          </button>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
            <Printer size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Calendar & Stats */}
        <div className="lg:col-span-8 space-y-8">
          <SmartCalendar
            appointments={appointments}
            onDateSelect={setSelectedDate}
            loading={loading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-200">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <CalendarIcon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">مواعيد اليوم</span>
              </div>
              <div className="mt-4">
                <h3 className="text-4xl font-bold">{todayApptsCount < 10 ? `0${todayApptsCount}` : todayApptsCount}</h3>
                <p className="text-xs font-medium mt-1 opacity-90">إجمالي الحجوزات المؤكدة لهذا اليوم</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                  <Clock className="text-amber-600" size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">طلبات معلقة</span>
              </div>
              <div className="mt-4">
                <h3 className="text-4xl font-bold text-slate-800">{pendingApptsCount < 10 ? `0${pendingApptsCount}` : pendingApptsCount}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">تنتظر التأكيد أو المراجعة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Day Schedule */}
        <div className="lg:col-span-4 h-full">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full min-h-[600px] overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">أجندة اليوم</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'appointments' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >حجوزات</button>
                  <button
                    onClick={() => setActiveTab('availability')}
                    className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'availability' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >المتاحة</button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <CalendarIcon size={14} />
                <span className="text-xs font-bold">{format(selectedDate, 'EEEE, d MMMM')}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {activeTab === 'appointments' ? (
                filteredAppts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <CalendarIcon className="text-slate-300" size={32} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-600">لا توجد مواعيد</h4>
                    <p className="text-xs text-slate-400 mt-1">لم يتم حجز أي مواعيد لهذا التاريخ</p>
                  </div>
                ) : (
                  filteredAppts.map((apt) => (
                    <div key={apt._id} className="relative group">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 border-white ring-2 ring-slate-100 z-10 
                            ${apt.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                          <div className="flex-1 w-px bg-slate-100 my-1"></div>
                        </div>
                        <div className="flex-1 -mt-1 pb-6">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-400">{apt.startTime} - {apt.endTime}</span>
                            <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{apt.patientDetails?.name || apt.patient?.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <Clock size={10} /> {apt.reason || 'استشارة طبية'}
                            </p>

                            {apt.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => handleStatusChange(apt._id, 'confirmed')} className="flex-1 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700">تأكيد</button>
                                <button onClick={() => handleStatusChange(apt._id, 'cancelled')} className="flex-1 py-1.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-300">إلغاء</button>
                              </div>
                            )}

                            {apt.status === 'confirmed' && (
                              <button onClick={() => handleStatusChange(apt._id, 'completed')} className="w-full mt-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700">إكمال الموعد</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="space-y-4">
                  {slotsLoading ? (
                    <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-10"><p className="text-xs text-slate-400">لا توجد ساعات عمل لهذا اليوم</p></div>
                  ) : (
                    slots.map((slot) => (
                      <div key={slot.start} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{slot.start} - {slot.end}</p>
                          <p className={`text-[10px] font-bold mt-1 ${slot.status === 'available' ? 'text-emerald-500' : slot.status === 'booked' ? 'text-blue-500' : 'text-slate-400'}`}>
                            {slot.status === 'available' ? 'متاح' : slot.status === 'booked' ? 'محجوز' : 'محظور من قبلك'}
                          </p>
                        </div>
                        {slot.status !== 'booked' && (
                          <button
                            onClick={() => handleToggleBlock(slot.start)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${slot.status === 'blocked' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white border border-slate-200 text-rose-500 hover:bg-rose-50'}`}
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
    </div>
  );
};

export default Schedule;
