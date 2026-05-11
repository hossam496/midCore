import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  Download,
  ArrowRight,
  Plus,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { useBooking } from '../context/BookingContext';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const { bookingData, clearBooking } = useBooking();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const checkRef = useRef(null);
  const receiptRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadAndPrint = async () => {
    if (!receiptRef.current) return;
    
    try {
      setIsDownloading(true);
      
      // Save current scroll position and scroll to top
      const scrollY = window.scrollY;
      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
      });

      window.scrollTo(0, scrollY);

      // Convert to Blob for better mobile support
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('حدث خطأ أثناء معالجة الصورة');
          setIsDownloading(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${appointmentId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('تم تحميل الإيصال كصورة');
        setIsDownloading(false);

        // Open print dialog immediately after download
        setTimeout(() => {
          window.print();
        }, 500);

      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Failed to generate receipt:', error);
      toast.error('حدث خطأ أثناء تحميل الإيصال. يرجى المحاولة مرة أخرى.');
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] print:bg-white pt-32 print:pt-0 pb-20 px-6 flex flex-col items-center justify-center overflow-hidden" ref={containerRef}>

      {/* Success Icon */}
      <div ref={checkRef} className="print:hidden w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-xl shadow-green-200 mb-8 relative">
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
        <Check size={48} className="text-green-600 stroke-[3px]" />
      </div>

      {/* Main Message */}
      <div className="print:hidden text-center space-y-4 mb-12 max-w-lg">
        <h1 className="animate-up text-4xl md:text-5xl font-black text-gray-900 tracking-tight">تم تأكيد الحجز!</h1>
        <p className="animate-up text-lg text-gray-500 font-medium">
          تم جدولة موعدك مع <span className="text-blue-600 font-bold">{doctor.user?.name || doctor.name}</span> بنجاح.
        </p>
      </div>

      {/* Summary Card (Wrapper for animation) */}
      <div className="animate-up w-full max-w-xl relative mb-12 print:mb-0 print:shadow-none">
        
        {/* Actual Receipt Container for html2canvas & Print */}
        <div 
          ref={receiptRef}
          id="receipt-container"
          className="w-full bg-white rounded-[2.5rem] print:rounded-none p-8 md:p-12 border border-gray-100 print:border-none shadow-2xl shadow-blue-900/5 print:shadow-none relative"
        >
          {/* Receipt Header (Logo & Title) */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-50 print:border-gray-300">
            <div>
              <h3 className="text-xl font-black text-gray-900">إيصال الحجز</h3>
              <p className="text-sm font-bold text-gray-400 mt-1">عيادات ميدكور التخصصية</p>
              <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString('ar-EG')}</p>
            </div>
            <div className="text-left">
              {/* Appointment ID Tag */}
              <span className="text-[10px] font-mono font-black text-gray-300 uppercase tracking-widest bg-gray-50 print:bg-white px-3 py-1 rounded-full border border-gray-100 print:border-gray-400">
                ID: {appointmentId}
              </span>
              <div className="mt-3 text-xs font-bold px-3 py-1 bg-green-50 print:bg-white text-green-600 print:text-black rounded-full inline-block border border-green-100 print:border-gray-400">
                مؤكد
              </div>
            </div>
          </div>

          <div className="space-y-8">
            
            {/* Patient & Doctor Info */}
            <div className="bg-blue-50/30 print:bg-white rounded-2xl p-6 border border-blue-100/50 print:border-gray-300">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">المريض</p>
                    <p className="text-sm font-bold text-gray-900">{user?.name || 'مريض غير مسجل'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">الطبيب</p>
                    <p className="text-sm font-bold text-gray-900">{doctor.user?.name || doctor.name}</p>
                    <p className="text-xs font-bold text-blue-600/70 print:text-gray-600">{doctor.specialty || 'تخصص عام'}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Date & Time */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 print:bg-white print:border print:border-gray-300 rounded-2xl flex items-center justify-center text-blue-600 print:text-gray-800 flex-shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">الوقت والتاريخ</p>
                  <p className="text-lg font-bold text-gray-900">{formattedDate}</p>
                  <p className="text-sm font-bold text-blue-600/70 print:text-gray-600">{bookingData.time || 'صباحاً ١٠:٣٠'}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 print:bg-white print:border print:border-gray-300 rounded-2xl flex items-center justify-center text-blue-600 print:text-gray-800 flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">الموقع</p>
                  <p className="text-lg font-bold text-gray-900">مركز ميدكور</p>
                  <p className="text-sm font-bold text-gray-400">الشارع الرئيسي، المنطقة ٤</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-50 print:border-gray-300">
              <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <QRCode 
                  value={`https://med-core.vercel.app/verify/${appointmentId}`}
                  size={100}
                  level="H"
                  className="opacity-80 print:opacity-100"
                />
              </div>
              <p className="text-[10px] font-bold text-gray-300 mt-3 tracking-widest">امسح الكود للتحقق من الحجز</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="print:hidden animate-up flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl">
        <Button
          variant="primary"
          onClick={() => {
            clearBooking();
            navigate('/dashboard'); // Or patient dashboard
          }}
          className="w-full sm:flex-1 py-5 rounded-[2rem] shadow-xl shadow-blue-200 font-bold"
        >
          العودة للوحة التحكم
          <ArrowLeft size={20} className="mr-2" />
        </Button>
        <button 
          onClick={handleDownloadAndPrint}
          disabled={isDownloading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors bg-white border border-gray-100 rounded-[2rem] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Download size={20} />
          )}
          {isDownloading ? 'جاري التجهيز...' : 'طباعة وتحميل الإيصال'}
        </button>
      </div>

      {/* Back Link */}
      <Link
        to="/"
        className="print:hidden animate-up flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mt-12 hover:text-blue-600 transition-colors"
      >
        <ArrowRight size={14} />
        العودة للرئيسية
      </Link>

    </div>
  );
};

export default BookingConfirmationPage;
