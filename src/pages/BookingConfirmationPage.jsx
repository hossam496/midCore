import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  Download,
  ArrowRight,
  Plus,
  ArrowLeft
} from 'lucide-react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { useBooking } from '../context/BookingContext';
import Button from '../components/Button';

const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const { bookingData, clearBooking } = useBooking();
  const containerRef = useRef(null);
  const checkRef = useRef(null);

  const doctor = bookingData.doctor || { user: { name: 'Dr. Sarah Johnson' } };
  const appointmentId = "MC-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  const formattedDate = bookingData.date
    ? new Date(bookingData.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'لم يتم الاختيار';

  useEffect(() => {
    // Confetti burst on load
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // GSAP Animations
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.fromTo(checkRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1.2, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
      )
        .to(checkRef.current, { scale: 1, duration: 0.2 })
        .from(".animate-up", {
          y: 30,
          opacity: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.2");
    }, containerRef);

    return () => {
      ctx.revert();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-32 pb-20 px-6 flex flex-col items-center justify-center overflow-hidden" ref={containerRef}>

      {/* Success Icon */}
      <div ref={checkRef} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-xl shadow-green-200 mb-8 relative">
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
        <Check size={48} className="text-green-600 stroke-[3px]" />
      </div>

      {/* Main Message */}
      <div className="text-center space-y-4 mb-12 max-w-lg">
        <h1 className="animate-up text-4xl md:text-5xl font-black text-gray-900 tracking-tight">تم تأكيد الحجز!</h1>
        <p className="animate-up text-lg text-gray-500 font-medium">
          تم جدولة موعدك مع <span className="text-blue-600 font-bold">{doctor.user?.name || doctor.name}</span> بنجاح.
        </p>
      </div>

      {/* Summary Card */}
      <div className="animate-up w-full max-w-xl bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-2xl shadow-blue-900/5 relative mb-12">
        {/* Appointment ID Tag */}
        <div className="absolute top-8 left-8">
          <span className="text-[10px] font-mono font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            ID: {appointmentId}
          </span>
        </div>

        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date & Time */}
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">الوقت والتاريخ</p>
                <p className="text-lg font-bold text-gray-900">{formattedDate}</p>
                <p className="text-sm font-bold text-blue-600/70">{bookingData.time || 'صباحاً ١٠:٣٠'}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">الموقع</p>
                <p className="text-lg font-bold text-gray-900">مركز ميدكور</p>
                <p className="text-sm font-bold text-gray-400">الشارع الرئيسي، المنطقة ٤</p>
              </div>
            </div>
          </div>

          {/* Add to Calendar */}
          <button className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-all border border-blue-100/50">
            <Plus size={16} />
            إضافة إلى تقويم جوجل
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="animate-up flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl">
        <Button
          variant="primary"
          onClick={() => {
            clearBooking();
            navigate('/doctor/dashboard'); // Or patient dashboard if exists
          }}
          className="w-full sm:flex-1 py-5 rounded-[2rem] shadow-xl shadow-blue-200 font-bold"
        >
          العودة للوحة التحكم
          <ArrowLeft size={20} className="mr-2" />
        </Button>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors bg-white border border-gray-100 rounded-[2rem] hover:bg-gray-50">
          <Download size={20} />
          تحميل الإيصال
        </button>
      </div>

      {/* Back Link */}
      <Link
        to="/"
        className="animate-up flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mt-12 hover:text-blue-600 transition-colors"
      >
        <ArrowRight size={14} />
        العودة للرئيسية
      </Link>

    </div>
  );
};

export default BookingConfirmationPage;
