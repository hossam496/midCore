import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Icons مع فحص الأمان
import * as LucideIcons from 'lucide-react';
const { 
  Check, Calendar, Clock, MapPin, Download, 
  ArrowRight, Plus, ArrowLeft, Loader2 
} = LucideIcons;

// استيراد QRCode بشكل ديناميكي لتجنب مشاكل الـ Bundling في Production
const QRCode = lazy(() => import('react-qr-code').then(module => {
  // بعض النسخ تصدر كـ Default وبعضها كـ Named Export
  return { default: module.default || module };
}).catch(err => {
  console.error('Failed to load QRCode component', err);
  return { default: () => <div className="p-4 border border-dashed border-gray-200 text-[10px] text-gray-400">QR Code Unavailable</div> };
}));

import gsap from 'gsap';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

// Contexts
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';

// Components
import Button from '../components/Button';

/**
 * SafeRender - مكنون لحماية الصفحة من خطأ React #130
 * يضمن أن المكون موجود قبل محاولة رندرته
 */
const SafeRender = ({ component: Component, fallback = null, ...props }) => {
  if (!Component || (typeof Component !== 'function' && typeof Component !== 'object')) {
    return fallback;
  }
  return <Component {...props} />;
};

const BookingConfirmationPage = () => {
  // --- Debugging Zone for Production ---
  useEffect(() => {
    const componentsToVerify = { 
      LucideIcons, 
      Check, 
      Button, 
      Loader2, 
      html2canvas,
      gsap,
      confetti
    };
    
    console.log('🛡️ MedCore Production Guard: Verifying components...');
    Object.entries(componentsToVerify).forEach(([name, comp]) => {
      if (!comp) {
        console.error(`❌ Component/Module [${name}] is UNDEFINED! This triggers Error #130.`);
      }
    });
  }, []);

  const navigate = useNavigate();
  const { bookingData, clearBooking } = useBooking();
  const { user } = useAuth();
  const receiptRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // حماية البيانات لتجنب أي undefined
  const doctor = bookingData?.doctor || { user: { name: 'طبيب ميدكور' } };
  const doctorName = typeof (doctor.user?.name || doctor.name) === 'object' 
    ? 'طبيب ميدكور' 
    : (doctor.user?.name || doctor.name || 'طبيب ميدكور');
  
  const appointmentId = "MC-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  useEffect(() => {
    if (!bookingData?.doctor) {
      // إذا لم تكن هناك بيانات حجز، نوجه المستخدم للبحث بعد 3 ثواني
      const timer = setTimeout(() => {
        navigate('/specialists');
      }, 3000);
      return () => clearTimeout(timer);
    }

    // تأثير الاحتفال
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#3b82f6', '#60a5fa']
    });

    // أنيميشن الدخول
    gsap.from(".animate-up", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
      stagger: 0.2
    });
  }, [bookingData, navigate]);

  const handleDownloadAndPrint = async () => {
    if (!receiptRef.current) return;
    
    try {
      setIsDownloading(true);
      
      const scrollY = window.scrollY;
      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
      });

      window.scrollTo(0, scrollY);

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `MedCore-Receipt-${appointmentId}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('تم تحميل الإيصال كصورة');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('فشل تحميل الإيصال');
    } finally {
      setIsDownloading(false);
    }
  };

  // حالة عدم وجود بيانات (Safety Guard)
  if (!bookingData?.doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <LucideIcons.AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">لا توجد بيانات حجز حالية</h2>
        <p className="text-gray-500 mb-6">سيتم توجيهك لصفحة البحث تلقائياً...</p>
        <Link to="/specialists" className="text-blue-600 font-bold hover:underline">اضغط هنا للانتقال فوراً</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-28 pb-20 flex flex-col items-center px-6">
      
      {/* Summary Card */}
      <div className="animate-up w-full max-w-xl relative mb-12">
        <div 
          ref={receiptRef}
          className="w-full bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-2xl shadow-blue-900/5 relative overflow-hidden"
        >
          {/* Success Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-6">
              <SafeRender component={Check} size={40} fallback={<span>✓</span>} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">تم الحجز بنجاح!</h1>
            <p className="text-gray-400 font-medium">رقم الموعد: <span className="text-blue-600 font-bold">{appointmentId}</span></p>
          </div>

          <div className="space-y-8">
            
            {/* Patient & Doctor Info */}
            <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">المريض</p>
                  <p className="text-sm font-bold text-gray-900">{user?.name || 'مريض ميدكور'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">الطبيب</p>
                  <p className="text-sm font-bold text-gray-900">{doctorName}</p>
                  <p className="text-xs font-bold text-blue-600/70">
                    {typeof doctor.specialty === 'string' ? doctor.specialty : 'تخصص عام'}
                  </p>
                </div>
              </div>
            </div>

            {/* DateTime Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                  <SafeRender component={Calendar} size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">التاريخ</p>
                  <p className="text-sm font-bold text-gray-900">
                    {bookingData.date ? new Date(bookingData.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                  <SafeRender component={Clock} size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">الوقت</p>
                  <p className="text-sm font-bold text-gray-900">{bookingData.time}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-50">
              <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm min-h-[100px] flex items-center justify-center">
                <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />}>
                  <QRCode 
                    value={`https://med-core.vercel.app/verify/${appointmentId}`}
                    size={100}
                    level="H"
                  />
                </Suspense>
              </div>
              <p className="text-[10px] font-bold text-gray-300 mt-4 uppercase tracking-[0.2em]">أبرز الكود عند وصولك للمركز</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="animate-up flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <Button 
          variant="primary" 
          className="flex-1 py-5 rounded-[2rem] shadow-xl shadow-blue-200 text-sm font-bold"
          onClick={() => navigate('/dashboard')}
        >
          العودة للوحة التحكم
          <SafeRender component={ArrowLeft} size={20} className="mr-2" />
        </Button>
        <button 
          onClick={handleDownloadAndPrint}
          disabled={isDownloading}
          className="flex-1 flex items-center justify-center gap-2 px-10 py-5 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-[2rem] hover:bg-gray-50 disabled:opacity-50"
        >
          {isDownloading ? (
            <SafeRender component={Loader2} className="animate-spin" size={20} />
          ) : (
            <>
              <SafeRender component={Download} size={20} />
              تحميل الإيصال
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
