import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Briefcase,
  Globe,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getDoctorById } from '../api/doctorApi';
import { getOrCreateConversation } from '../api/chatApi';
import { getAvailableSlots } from '../api/appointmentApi';
import { BASE_URL } from '../api/axiosInstance';
import { useBooking } from '../context/BookingContext';
import Button from '../components/Button';
import ExperienceTimeline from '../components/profile/ExperienceTimeline';
import EducationList from '../components/profile/EducationList';
import PatientReviews from '../components/profile/PatientReviews';

gsap.registerPlugin(ScrollTrigger);

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateBooking } = useBooking();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const widgetRef = useRef(null);
  const profileRef = useRef(null);
  const bottomRef = useRef(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleChat = async () => {
    if (!doctor || !doctor.user) return;
    try {
      setChatLoading(true);
      const res = await getOrCreateConversation(doctor.user._id);
      const conversation = res.data.conversation;
      navigate('/messages', { state: { selectedConversationId: conversation._id } });
    } catch (err) {
      console.error('Failed to start chat', err);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchSlots = useCallback(async (dateStr) => {
    if (!id || !dateStr) return;
    try {
      setSlotsLoading(true);
      const res = await getAvailableSlots(id, dateStr);
      setAvailableSlots(res.data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setSlotsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + i);
    return {
      full: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      day: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
      num: date.getDate(),
      month: date.toLocaleDateString('ar-EG', { month: 'short' })
    };
  });

  const morningSlots = availableSlots.filter(s => s?.start && parseInt(s.start.split(':')[0]) < 18);
  const eveningSlots = availableSlots.filter(s => s?.start && parseInt(s.start.split(':')[0]) >= 18);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const res = await getDoctorById(id);
        const docData = res.data.doctor;

        const formatted = {
          ...docData,
          name: docData.user.name,
          role: docData.user.role === 'doctor' ? 'أخصائي طبي' : docData.user.role,
          experienceData: docData.experienceList && docData.experienceList.length > 0
            ? docData.experienceList.map(exp => ({
              title: exp.position,
              institution: exp.hospital,
              duration: ''
            }))
            : [{ title: docData.specialty, institution: 'مركز طبي', duration: docData.experience || 'خبير' }],
          educationData: docData.education && docData.education.length > 0
            ? docData.education.map(edu => ({
              degree: edu.degree,
              university: '',
              year: edu.year
            }))
            : [{ degree: 'درجة طبية', university: 'جامعة طبية', year: '' }],
          reviews: []
        };

        setDoctor(formatted);
        setSelectedDate(dates[0].full);
      } catch (err) {
        setError('لم يتم العثور على الطبيب أو حدث خطأ في الخادم.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  useEffect(() => {
    if (doctor && !loading) {
      const ctx = gsap.context(() => {
        gsap.from(".profile-header", {
          opacity: 0,
          x: -30,
          duration: 0.8,
          ease: "power3.out"
        });
        gsap.from(widgetRef.current, {
          opacity: 0,
          x: 30,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.2
        });

        gsap.from(".scroll-section", {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power3.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: bottomRef.current,
            start: "top 80%",
          }
        });
      });

      return () => ctx.revert();
    }
  }, [doctor, loading]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-500 font-bold text-xl">{error}</p>
      <Link to="/specialists" className="text-blue-600 font-bold hover:underline">العودة للبحث</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">

        <Link
          to="/specialists"
          className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-blue-600 transition-colors mb-8 group"
        >
          <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-blue-100 transition-all">
            <ArrowLeft size={18} />
          </div>
          العودة للبحث
        </Link>

        {doctor && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div ref={profileRef} className="lg:col-span-8 space-y-8">
              <div className="profile-header bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                  <div className="relative">
                    {doctor.image ? (
                      <img
                        src={doctor.image?.startsWith('http') ? doctor.image : `${BASE_URL}${doctor.image}`}
                        alt={doctor.name}
                        className="w-40 h-40 rounded-[2rem] object-cover border-4 border-blue-50 shadow-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-[2rem] bg-gray-100 flex items-center justify-center border-4 border-blue-50 shadow-lg">
                        <User size={64} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-white" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{doctor.name}</h1>
                        <p className="text-lg text-blue-600 font-bold mt-1">{doctor.role}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl self-center md:self-start">
                        <Star size={20} className="text-green-600 fill-current" />
                        <span className="font-bold text-green-700 text-lg">{doctor.rating || '4.9'}</span>
                        <span className="text-green-600/60 text-sm font-medium">(+١٢٠ مراجعة)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                          <MapPin size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">الموقع</p>
                          <p className="text-sm font-bold">{doctor.location || 'الرياض، السعودية'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                          <Briefcase size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">الخبرة</p>
                          <p className="text-sm font-bold">{doctor.experience || '١٠ سنوات'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                          <Globe size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">اللغات</p>
                          <p className="text-sm font-bold">{doctor.languages?.length > 0 ? doctor.languages.join('، ') : 'العربية'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">التخصصات والخبرات</h3>
                <div className="flex flex-wrap gap-3">
                  {doctor.specialties?.length > 0 ? doctor.specialties.map((skill, index) => (
                    <span key={`spec-${index}`} className="px-5 py-2.5 bg-gray-50 text-gray-600 text-sm font-bold rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-white hover:text-blue-600 transition-all cursor-default">
                      {skill}
                    </span>
                  )) : [doctor.specialty, 'استشارة', 'تشخيص'].map((skill, index) => (
                    <span key={`fallback-spec-${index}`} className="px-5 py-2.5 bg-gray-50 text-gray-600 text-sm font-bold rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-white hover:text-blue-600 transition-all cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">حول {doctor.name}</h3>
                <p className="text-gray-500 leading-relaxed">{doctor.bio || `${doctor.name} متخصص خبير مكرس لتقديم أفضل رعاية طبية.`}</p>
              </div>

              <div ref={bottomRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 scroll-section">
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                  <ExperienceTimeline experiences={doctor.experienceData} />
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                  <EducationList education={doctor.educationData} />
                </div>
              </div>

              <div className="scroll-section">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm">
                  <PatientReviews reviews={doctor.reviews || []} />
                </div>
              </div>
            </div>

            <div ref={widgetRef} className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 sticky top-28">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">حجز موعد</h3>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-gray-900">اختر التاريخ</p>
                    <p className="text-sm font-bold text-blue-600">مايو ٢٠٢٦</p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {dates.map((date) => (
                      <button
                        key={date.full}
                        onClick={() => { setSelectedDate(date.full); setSelectedSlot(null); }}
                        className={`flex-shrink-0 w-20 py-4 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${selectedDate === date.full ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100' : 'border-gray-50 bg-gray-50 hover:border-blue-200'}`}
                      >
                        <span className={`text-xs font-bold uppercase ${selectedDate === date.full ? 'text-blue-600' : 'text-gray-400'}`}>{date.day}</span>
                        <span className={`text-xl font-extrabold ${selectedDate === date.full ? 'text-blue-600' : 'text-gray-900'}`}>{date.num}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 mb-10">
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl">
                      <AlertCircle className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400">لا توجد مواعيد متاحة</p>
                    </div>
                  ) : (
                    <>
                      {morningSlots.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14} /> صباحاً</p>
                          <div className="grid grid-cols-2 gap-3">
                            {morningSlots.map((slot, idx) => (
                              <button key={`morning-${idx}-${slot.start}`} disabled={slot.status !== 'available'} onClick={() => setSelectedSlot(slot)} className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${slot.status !== 'available' ? 'bg-gray-50 border-gray-50 text-gray-300 cursor-not-allowed line-through' : selectedSlot?.start === slot.start ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 text-gray-700 hover:border-blue-600 hover:text-blue-600'}`}>{slot.start}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {eveningSlots.length > 0 && (
                        <div className={morningSlots.length > 0 ? 'mt-6' : ''}>
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14} /> مساءً</p>
                          <div className="grid grid-cols-2 gap-3">
                            {eveningSlots.map((slot, idx) => (
                              <button key={`evening-${idx}-${slot.start}`} disabled={slot.status !== 'available'} onClick={() => setSelectedSlot(slot)} className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${slot.status !== 'available' ? 'bg-gray-50 border-gray-50 text-gray-300 cursor-not-allowed line-through' : selectedSlot?.start === slot.start ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 text-gray-700 hover:border-blue-600 hover:text-blue-600'}`}>{slot.start}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fallback if filtering failed but slots exist */}
                      {availableSlots.length > 0 && morningSlots.length === 0 && eveningSlots.length === 0 && (
                        <div>
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">المواعيد المتاحة</p>
                          <div className="grid grid-cols-2 gap-3">
                            {availableSlots.map((slot, idx) => (
                              <button key={`all-${idx}-${slot.start}`} disabled={slot.status !== 'available'} onClick={() => setSelectedSlot(slot)} className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${slot.status !== 'available' ? 'bg-gray-50 border-gray-50 text-gray-300 cursor-not-allowed line-through' : selectedSlot?.start === slot.start ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 text-gray-700 hover:border-blue-600 hover:text-blue-600'}`}>{slot.start}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Button variant="primary" className={`w-full py-5 text-lg shadow-xl shadow-blue-200 ${!selectedSlot && 'opacity-50 pointer-events-none'}`} disabled={!selectedSlot} onClick={() => {
                  if (selectedSlot) {
                    const [year, month, day] = selectedDate.split('-');
                    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
                    updateBooking({ 
                      doctor, 
                      date: dateObj.toISOString(), 
                      time: selectedSlot.start,
                      startTime: selectedSlot.start,
                      endTime: selectedSlot.end
                    });
                    navigate(`/schedule/${id}`);
                  }
                }}>حجز موعد</Button>

                <div className="mt-4">
                  <Button variant="secondary" className="w-full flex items-center justify-center gap-2 border-blue-100 text-blue-600 hover:bg-blue-50" onClick={handleChat} disabled={chatLoading}>
                    {chatLoading ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <><MessageSquare size={20} /> تحدث مع الطبيب</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
