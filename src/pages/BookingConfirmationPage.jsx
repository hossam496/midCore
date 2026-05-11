import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { 
  Check, Calendar, Clock, MapPin, Download, 
  ArrowRight, Plus, ArrowLeft, Loader2, AlertCircle 
} from 'lucide-react';



import gsap from 'gsap';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

// Contexts
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';

// Components
import Button from '../components/Button';

// Removed SafeRender to simplify the component tree and prevent React #306


const BookingConfirmationPage = () => {
  // --- Debugging Zone for Production ---
  useEffect(() => {
    const componentsToVerify = { 
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

  // ✅ FIX: Stable ID generated ONCE via useState lazy initializer.
  // Using Math.random() directly in the render body re-generates on every
  // render and in React StrictMode (which double-invokes renders in dev).
  const [appointmentId] = useState(
    () => 'MC-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  );

  // حماية البيانات لتجنب أي undefined
  const doctor = bookingData?.doctor || { user: { name: 'طبيب ميدكور' } };
  const doctorName = typeof (doctor.user?.name || doctor.name) === 'object'
    ? 'طبيب ميدكور'
    : (doctor.user?.name || doctor.name || 'طبيب ميدكور');

  useEffect(() => {
    if (!bookingData?.doctor) {
      // إذا لم تكن هناك بيانات حجز، نوجه المستخدم للبحث بعد 3 ثواني
      const timer = setTimeout(() => {
        navigate('/specialists');
      }, 3000);
      return () => clearTimeout(timer);
    }

    // ✅ FIX: Track mounted state to prevent state updates after unmount
    let isMounted = true;

    // تأثير الاحتفال — only run when component is actually mounted
    const confettiTimer = setTimeout(() => {
      if (isMounted) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#3b82f6', '#60a5fa']
        });
      }
    }, 100);

    // ✅ FIX: Use receiptRef instead of a CSS class selector.
    // Targeting '.animate-up' can match elements in OTHER components
    // if they share the same class. ref-based targeting is surgical.
    const animCtx = gsap.context(() => {
      if (receiptRef.current) {
        gsap.from(receiptRef.current.querySelectorAll('.animate-up'), {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.2
        });
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(confettiTimer);
      // ✅ Revert all GSAP animations created in this context on unmount
      animCtx.revert();
    };
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
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">لا توجد بيانات حجز حالية</h2>
        <p className="text-gray-500 mb-6">سيتم توجيهك لصفحة البحث تلقائياً...</p>
        <Link to="/specialists" className="text-blue-600 font-bold hover:underline">اضغط هنا للانتقال فوراً</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 px-10 text-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Booking Confirmed!</h1>
      <p className="text-xl text-gray-600 mb-10">Your appointment ID is: <span className="font-bold text-gray-900">{appointmentId}</span></p>
      
      <div className="max-w-md mx-auto bg-gray-50 rounded-3xl p-8 mb-10 border border-gray-100">
        <p className="font-bold text-gray-900 mb-2">Doctor: {doctorName}</p>
        <p className="text-gray-500">Date: {bookingData.date || '-'}</p>
        <p className="text-gray-500">Time: {bookingData.time || '-'}</p>
      </div>

      <div className="flex gap-4 justify-center">
        <Button onClick={() => navigate('/')}>Home</Button>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>Dashboard</Button>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
