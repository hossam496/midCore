import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Check,
  Info,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import gsap from 'gsap';
import { getDoctorById } from '../api/doctorApi';
import { getAvailableSlots } from '../api/appointmentApi';
import { useBooking } from '../context/BookingContext';
import { getFullImageUrl } from '../api/axiosInstance';
import Button from '../components/Button';
import { format, addMonths, subMonths, isSameDay, isAfter, startOfDay } from 'date-fns';

const AppointmentPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { bookingData, updateBooking } = useBooking();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(bookingData.date ? new Date(bookingData.date) : null);
  const [selectedTime, setSelectedTime] = useState(bookingData.time);
  const [availableSlots, setAvailableSlots] = useState([]);
  const slotsRef = useRef(null);

  const fetchDoctor = useCallback(async () => {
    try {
      const res = await getDoctorById(doctorId);
      setDoctor(res.data.doctor);
      updateBooking({ doctor: res.data.doctor });
    } catch (err) {
      console.error('Failed to fetch doctor', err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchSlots = useCallback(async (date) => {
    if (!date) return;
    try {
      setSlotsLoading(true);
      const res = await getAvailableSlots(doctorId, format(date, 'yyyy-MM-dd'));
      setAvailableSlots(res.data.slots);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  useEffect(() => {
    if (selectedDate && slotsRef.current && !slotsLoading) {
      gsap.fromTo(".time-slot",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [selectedDate, slotsLoading]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    updateBooking({ date: date.toISOString(), time: null });
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot.start);
    updateBooking({ time: slot.start, startTime: slot.start, endTime: slot.end });
  };

  const steps = [
    { id: 1, name: 'اختر المتخصص' },
    { id: 2, name: 'الوقت والتاريخ' },
    { id: 3, name: 'بيانات المريض' },
    { id: 4, name: 'التأكيد' },
  ];

  const fees = {
    consultation: doctor?.consultationFee || 150,
    service: 15,
  };
  const total = fees.consultation + fees.service;

  // Group slots by time of day
  const morningSlots = availableSlots.filter(s => s?.start && parseInt(s.start.split(':')[0]) < 18);
  const eveningSlots = availableSlots.filter(s => s?.start && parseInt(s.start.split(':')[0]) >= 18);

  // Calendar Logic
  const daysInMonth = Array.from({ length: 35 }, (_, i) => {
    const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startOffset = day.getDay();
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - startOffset + 1);
  });

  const isToday = (date) => isSameDay(date, new Date());
  const isPast = (date) => !isAfter(startOfDay(date), startOfDay(subMonths(new Date(), 0))) && !isToday(date);
  const isDateSelected = (date) => selectedDate && isSameDay(date, selectedDate);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!doctor) return <div className="p-20 text-center font-bold text-red-500">لم يتم العثور على الطبيب.</div>;

  const renderSlotGrid = (slots, title) => (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-[2px] bg-blue-100"></div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {slots.map((slot) => (
          <button
            key={slot.start}
            onClick={() => slot.status === 'available' && handleTimeSelect(slot)}
            disabled={slot.status !== 'available'}
            className={`time-slot group relative py-5 px-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-1
              ${slot.status !== 'available'
                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed overflow-hidden'
                : selectedTime === slot.start
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105 z-10'
                  : 'border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-50/20'}
            `}
          >
            <span className="text-base font-black tracking-tight">{slot.start}</span>
            <span className={`text-[9px] uppercase tracking-widest font-black opacity-70 
              ${selectedTime === slot.start ? 'text-white' : slot.status === 'available' ? 'text-blue-500' : 'text-slate-400'}`}>
              {slot.status === 'available' ? `${slot.start} - ${slot.end}` : (slot.status === 'booked' ? 'محجوز' : 'غير متاح')}
            </span>
            {slot.status !== 'available' && (
              <div className="absolute top-0 right-0 w-8 h-8 bg-slate-100 translate-x-4 -translate-y-4 rotate-45"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-20">
      <div className="container mx-auto px-6 md:px-10 max-w-7xl">

        {/* Stepper */}
        <div className="mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep === step.id
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : currentStep > step.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                  }`}>
                  {currentStep > step.id ? <Check size={18} /> : step.id}
                </div>
                <span className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-16">

          {/* Left Column: Scheduling */}
          <div className="lg:col-span-8 space-y-10">

            {/* Calendar Section */}
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <CalendarIcon className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">اختر التاريخ</h2>
                    <p className="text-xs font-bold text-gray-400 opacity-80 uppercase tracking-widest mt-1">تحديد موعد الاستشارة</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight size={18} /></button>
                  <span className="font-bold text-slate-700 min-w-[120px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft size={18} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-3 text-center mb-6">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(d => (
                  <span key={d} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {daysInMonth.map((day, i) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const past = (!isToday(day) && day < startOfDay(new Date())) || !isCurrentMonth;
                  const selected = isDateSelected(day);

                  return (
                    <button
                      key={i}
                      disabled={past}
                      onClick={() => handleDateClick(day)}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all
                        ${selected
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 z-10 transform scale-105'
                          : past
                            ? 'text-gray-200 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-50/50'}
                      `}
                    >
                      {format(day, 'd')}
                      {isToday(day) && !selected && <div className="absolute bottom-2 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Section */}
            <div ref={slotsRef} className={`bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm transition-all duration-500 ${selectedDate ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">المواعيد المتاحة</h2>
                    <p className="text-xs font-bold text-gray-400 opacity-80 uppercase tracking-widest mt-1">اختر التوقيت المناسب لك</p>
                  </div>
                </div>
                {slotsLoading && <div className="flex items-center gap-2 text-blue-600 text-xs font-bold animate-pulse"><Clock size={16} /> جاري التحديث...</div>}
              </div>

              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <CalendarIcon className="text-gray-200 mb-4" size={48} />
                  <p className="text-gray-400 font-bold">الرجاء تحديد تاريخ من التقويم أعلاه لعرض المواعيد</p>
                </div>
              ) : availableSlots.length === 0 && !slotsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-rose-50 border border-rose-100 rounded-3xl">
                  <AlertCircle className="text-rose-400 mb-4" size={48} />
                  <p className="text-rose-600 font-bold">عذراً، لا توجد مواعيد متاحة في هذا اليوم</p>
                  <p className="text-rose-400 text-xs mt-2 font-medium">حاول اختيار تاريخ آخر أو التواصل مع العيادة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {morningSlots.length > 0 && renderSlotGrid(morningSlots, "الفترة الصباحية (قبل 6 مساءً)")}
                  {eveningSlots.length > 0 && renderSlotGrid(eveningSlots, "الفترة المسائية (6 مساءً - 10 مساءً)")}
                </div>
              )}
            </div>
            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
              <Button
                variant="text"
                onClick={() => navigate(-1)}
                className="px-10 border border-slate-200 hover:bg-slate-50 font-bold rounded-2xl"
              >
                رجوع
              </Button>
              <Button
                variant="primary"
                disabled={!selectedDate || !selectedTime}
                onClick={() => navigate('/patient-details')}
                className="px-12 py-5 rounded-[2rem] shadow-2xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none font-bold group"
              >
                <span>المتابعة إلى التفاصيل</span>
                <ArrowLeft size={20} className="mr-3 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Right Column: Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-700"></div>

                <h3 className="text-lg font-bold text-gray-900 mb-8 relative z-10">ملخص الحجز</h3>

                {/* Doctor Mini Profile */}
                <div className="flex items-center gap-4 pb-8 border-b border-gray-50 mb-8 relative z-10">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                    <img
                      src={getFullImageUrl(doctor.image)}
                      alt={doctor.user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">د. {doctor.user?.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded-md w-fit">
                      <Stethoscope size={14} />
                      {doctor.specialty}
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-6 mb-10 relative z-10">
                  <div className="flex justify-between items-center group/item">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="text-slate-300 group-hover/item:text-blue-500 transition-colors" size={16} />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">التارِيخ</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900" dir="rtl">
                      {selectedDate ? format(selectedDate, 'd MMMM yyyy') : 'لم يتم الاختيار'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/item">
                    <div className="flex items-center gap-2">
                      <Clock className="text-slate-300 group-hover/item:text-blue-500 transition-colors" size={16} />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">الموعِد</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900" dir="ltr">
                      {selectedTime || 'لم يتم الاختيار'}
                    </span>
                  </div>
                </div>

                {/* Fees Breakdown */}
                <div className="space-y-4 pt-8 border-t border-slate-50 mb-8 relative z-10">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">رسوم الاستشارة</span>
                    <span className="text-gray-900">${fees.consultation}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">رسوم الخدمة</span>
                    <span className="text-gray-900">${fees.service}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black pt-4 text-blue-600 border-t border-dashed border-slate-100">
                    <span>الإجمالي</span>
                    <span>${total}</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-slate-50 rounded-2xl p-5 flex gap-4 border border-slate-100 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Info className="text-blue-600" size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                    يتم الحجز بأمان عبر نظام MedCore. سيتم تأكيد الموعد فوراً وإرسال رسالة نصية لك بكافة التفاصيل.
                  </p>
                </div>
              </div>

              {/* Secure Booking Tag */}
              <div className="flex items-center justify-center gap-3 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default py-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Check size={12} strokeWidth={4} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">نظام حجز مشفر وآمن بالكامل</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AppointmentPage;
