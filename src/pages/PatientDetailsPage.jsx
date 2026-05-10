import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  FileText,
  Check,
  ArrowRight,
  Stethoscope,
  Clock
} from 'lucide-react';
import gsap from 'gsap';
import { createAppointment } from '../api/appointmentApi';
import { useBooking } from '../context/BookingContext';
import getImageUrl from '../utils/imageUrl';
import Button from '../components/Button';

const PatientDetailsPage = () => {
  const navigate = useNavigate();
  const { bookingData, updatePatientDetails, clearBooking } = useBooking();
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Local state for immediate form feedback
  const [formData, setFormData] = useState(bookingData.patientDetails);

  useEffect(() => {
    gsap.fromTo(formRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    // Safety check: if no doctor or date, go back
    if (!bookingData.doctor || !bookingData.date) {
      navigate('/specialists');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    updatePatientDetails({ [name]: value });
  };

  const steps = [
    { id: 1, name: 'اختر المتخصص' },
    { id: 2, name: 'الوقت والتاريخ' },
    { id: 3, name: 'بيانات المريض' },
    { id: 4, name: 'التأكيد' },
  ];

  const currentStep = 3;
  const doctor = bookingData.doctor || {};
  const fees = { consultation: doctor.consultationFee || 150, service: 15 };
  const total = fees.consultation + fees.service;

  const isFormValid = formData.fullName && formData.email && formData.phone && formData.dob && formData.gender && formData.reason;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setSubmitting(true);
      setError(null);

      const appointmentPayload = {
        doctorId: doctor._id,
        date: bookingData.date,
        startTime: bookingData.startTime || bookingData.time,
        endTime: bookingData.endTime,
        reason: formData.reason,
        patientDetails: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
        }
      };

      const res = await createAppointment(appointmentPayload);
      if (res.data.success) {
        // We might want to keep the appointment ID in context for Step 4
        navigate('/booking-confirmation');
        // We don't clear context yet so confirmation page can show data
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'فشل حجز الموعد. الرجاء المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

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
                      ? 'bg-green-500 text-white'
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

          {/* Left Column: Form */}
          <div ref={formRef} className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">معلومات المريض</h2>
                  <p className="text-sm text-gray-400 font-medium">الرجاء تقديم تفاصيل دقيقة لموعدك</p>
                </div>
              </div>

              <form className="space-y-8">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">الاسم الكامل</label>
                    <div className="relative group">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="مثل: محمد خالد"
                        className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">البريد الإلكتروني</label>
                    <div className="relative group">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="mail@example.com"
                        className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">رقم الهاتف</label>
                    <div className="relative group">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="٠٥٠١٢٣٤٥٦٧"
                        className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">تاريخ الميلاد</label>
                    <div className="relative group">
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">الجنس</label>
                  <div className="relative group">
                    <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium appearance-none"
                    >
                      <option value="">اختر الجنس</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                      <option value="other">آخر</option>
                    </select>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">سبب الزيارة</label>
                  <div className="relative group">
                    <FileText className="absolute right-4 top-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows="4"
                      placeholder="صف الأعراض أو سبب الزيارة..."
                      className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium resize-none"
                    ></textarea>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="text"
                onClick={() => navigate(-1)}
                className="px-10 py-5 border border-gray-200 hover:bg-gray-50 rounded-[2rem] font-bold"
              >
                رجوع
              </Button>
              <Button
                variant="primary"
                disabled={!isFormValid || submitting}
                className="px-12 py-5 rounded-[2rem] shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none font-bold"
                onClick={handleSubmit}
              >
                {submitting ? 'جاري المعالجة...' : 'تأكيد الحجز'}
                {submitting ? (
                  <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={20} className="mr-2" />
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص الموعد</h3>

                {/* Doctor Info */}
                <div className="flex items-center gap-4 pb-6 border-b border-gray-50 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-blue-50">
                    <img
                      src={getImageUrl(doctor.image)}
                      alt={doctor.user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{doctor.user?.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mt-1">
                      <Stethoscope size={14} />
                      {doctor.specialty}
                    </div>
                  </div>
                </div>

                {/* Highlighted Box */}
                <div className="bg-blue-50 rounded-2xl p-5 space-y-2 mb-8 border border-blue-100/50">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar size={16} />
                    <span className="text-sm font-bold">
                      {bookingData.date ? new Date(bookingData.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'اختر التاريخ'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Clock size={16} />
                    <span className="text-sm font-bold opacity-80">{bookingData.time || 'اختر الوقت'}</span>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="space-y-3 pt-6 border-t border-gray-50">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-500">رسوم الاستشارة</span>
                    <span className="text-gray-900">${fees.consultation}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-500">رسوم المنصة</span>
                    <span className="text-gray-900">${fees.service}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black pt-4 text-blue-600 border-t border-gray-50 mt-4">
                    <span>التكلفة الإجمالية</span>
                    <span>${total}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 rounded-[2rem] p-6 text-white text-center shadow-xl shadow-blue-200">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">دعم فوري</p>
                <p className="font-bold">بحاجة للمساعدة في الحجز؟</p>
                <button className="mt-4 bg-white text-blue-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                  محادثة مباشرة
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientDetailsPage;
