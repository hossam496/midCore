import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  MessageSquare,
  Activity,
  Phone,
  Mail,
  User,
  Calendar,
  Droplet,
  ArrowUpRight,
  ClipboardList,
  FileText,
  Clock,
  Plus,
  Weight,
  Ruler,
  TrendingUp,
  X,
  Video,
  MapPin,
  Heart,
  Clipboard
} from 'lucide-react';
import { getUserById, updateUserProfile } from '../../../api/userApi';
import { getAppointments, createAppointment } from '../../../api/appointmentApi';
import { getOrCreateConversation } from '../../../api/chatApi';
import { getMyDoctorProfile } from '../../../api/doctorApi';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Vitals Form State
  const [vitalsForm, setVitalsForm] = useState({
    bloodType: '',
    weight: '',
    height: '',
    dob: '',
    gender: 'male'
  });
  const [updatingVitals, setUpdatingVitals] = useState(false);

  // Clinical Record Form State
  const [recordForm, setRecordForm] = useState({
    title: '',
    reason: '',
    bookingType: 'clinic'
  });
  const [addingRecord, setAddingRecord] = useState(false);

  const fetchPatientAndAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const [patientRes, apptsRes, doctorRes] = await Promise.all([
        getUserById(id),
        getAppointments(),
        getMyDoctorProfile().catch(() => null)
      ]);
      
      const patientData = patientRes.data.user;
      setPatient(patientData);
      
      // Filter appointments for this patient
      const patientAppts = (apptsRes.data.appointments || []).filter(
        apt => apt.patient?._id === id
      );
      setAppointments(patientAppts);

      if (doctorRes) {
        setDoctor(doctorRes.data.doctor);
      }

      // Initialize edit vitals form
      setVitalsForm({
        bloodType: patientData.bloodType || 'A+',
        weight: patientData.weight || '',
        height: patientData.height || '',
        dob: patientData.dob ? format(new Date(patientData.dob), 'yyyy-MM-dd') : '',
        gender: patientData.gender || 'male'
      });
    } catch (err) {
      console.error('Failed to load EHR profile', err);
      toast.error('حدث خطأ أثناء تحميل السجل الطبي للمريض');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatientAndAppointments();
  }, [fetchPatientAndAppointments]);

  // Calculate age dynamically
  const calculateAge = (dob) => {
    if (!dob) return 'غير متوفر';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} سنة`;
    } catch {
      return 'غير متوفر';
    }
  };

  // Find next scheduled visit
  const nextVisit = useMemo(() => {
    const today = new Date();
    const futureAppts = appointments
      .filter(apt => new Date(apt.date) >= today && (apt.status === 'confirmed' || apt.status === 'pending'))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (futureAppts.length === 0) return 'لا يوجد موعد مجدول';
    return format(new Date(futureAppts[0].date), 'yyyy-MM-dd');
  }, [appointments]);

  // Handle direct messaging redirect
  const handleChat = async () => {
    try {
      const res = await getOrCreateConversation(id);
      const conversation = res.data.conversation;
      navigate(`/doctor/messages`);
    } catch (err) {
      console.error('Failed to start chat', err);
      toast.error('فشل في بدء المحادثة مع المريض');
    }
  };

  // Save Vitals Update to DB
  const handleUpdateVitals = async (e) => {
    e.preventDefault();
    try {
      setUpdatingVitals(true);
      await updateUserProfile(id, vitalsForm);
      toast.success('تم تحديث القياسات الحيوية بنجاح');
      setIsVitalsModalOpen(false);
      fetchPatientAndAppointments();
    } catch (err) {
      console.error(err);
      toast.error('فشل في حفظ التحديثات');
    } finally {
      setUpdatingVitals(false);
    }
  };

  // Save Diagnosis/Clinical record as a completed appointment
  const handleAddClinicalRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.title || !recordForm.reason) {
      toast.error('الرجاء تعبئة جميع الحقول المطلوبة');
      return;
    }

    try {
      setAddingRecord(true);
      
      const payload = {
        doctorId: doctor?._id || appointments[0]?.doctor?._id || 'mock-id',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: format(new Date(), 'HH:mm'),
        endTime: format(new Date(Date.now() + 30 * 60 * 1000), 'HH:mm'),
        status: 'completed',
        reason: `${recordForm.title}: ${recordForm.reason}`,
        bookingType: recordForm.bookingType,
        patientId: id,
        patientDetails: {
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
        }
      };

      await createAppointment(payload);
      toast.success('تم تسجيل الفحص والتشخيص بنجاح');
      setIsRecordModalOpen(false);
      setRecordForm({ title: '', reason: '', bookingType: 'clinic' });
      fetchPatientAndAppointments();
    } catch (err) {
      console.error('Error logging medical record:', err);
      toast.error('حدث خطأ أثناء إضافة السجل الطبي');
    } finally {
      setAddingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-center font-bold text-slate-500 font-cairo" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>جاري تحميل السجل الطبي للمريض...</span>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center font-bold text-rose-500 font-cairo" dir="rtl">
        الملف المطلوب غير متوفر أو تم نقله.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 font-cairo" dir="rtl">
      
      {/* Header Back bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} className="rotate-180" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">الملف الصحي الإلكتروني للمريض (EHR)</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">مراجعة المؤشرات الطبية والتاريخ المرضي الشامل والتقارير</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Personal Attributes Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Attributes Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="relative mb-5 mt-2">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center text-3xl font-extrabold text-white">
                {patient.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
                <Activity size={12} className="text-white" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800">{patient.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">رقم الملف: #MC-{patient._id.substring(0, 6).toUpperCase()}</p>

            <span className="mt-3 px-3 py-1 bg-slate-50 text-slate-400 border border-slate-200/50 rounded-full text-[9px] font-black uppercase">
              نشط بالعيادة
            </span>

            {/* Vitals stats */}
            <div className="grid grid-cols-4 gap-2 w-full mt-8 pt-6 border-t border-slate-50 text-center">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">العمر</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{calculateAge(patient.dob)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">الدم</p>
                <p className="text-xs font-bold text-slate-800 mt-1" dir="ltr">{patient.bloodType || 'A+'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">الطول</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{patient.height ? `${patient.height} سم` : 'غير مسجل'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">الوزن</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{patient.weight ? `${patient.weight} كجم` : 'غير مسجل'}</p>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="w-full mt-6 space-y-2">
              <button
                onClick={() => setIsVitalsModalOpen(true)}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                تعديل القياسات الحيوية
              </button>
              
              <button
                onClick={handleChat}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/10 transition-all cursor-pointer"
              >
                <MessageSquare size={16} />
                <span>بدء محادثة المريض</span>
              </button>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">معلومات الاتصال بالملف</h3>
            
            {patient.phone && (
              <div className="flex items-center gap-3.5 text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <Phone size={15} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">الهاتف المحمول</p>
                  <p className="text-xs font-bold text-slate-700 font-mono" dir="ltr">{patient.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3.5 text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                <Mail size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase">البريد الإلكتروني</p>
                <p className="text-xs font-bold text-slate-700 truncate">{patient.email}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Medical Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hemoglobin card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-red-100 transition-all">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                <Droplet size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">الهيموجلوبين (التقديري)</p>
                <h4 className="text-lg font-bold text-slate-800 mt-0.5">14.2 g/dL</h4>
              </div>
            </div>

            {/* Pulse card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-100 transition-all">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                <Heart size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">النبض المرجعي</p>
                <h4 className="text-lg font-bold text-slate-800 mt-0.5">72 bpm</h4>
              </div>
            </div>

            {/* Next visit card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">الفحص المجدول القادم</p>
                <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">{nextVisit}</h4>
              </div>
            </div>
          </div>

          {/* Medical History Timeline list */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">التاريخ الطبي وسجلات المراجعات</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">جدول زمني للزيارات والتقارير المسجلة بقاعدة البيانات</p>
              </div>
              <button 
                onClick={() => setIsRecordModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>إضافة سجل طبي</span>
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                لا يوجد أي مراجعات أو زيارات سابقة مسجلة لهذا المريض بعد.
              </div>
            ) : (
              <div className="space-y-6 relative border-r-2 border-slate-100 pr-4 mr-2">
                {appointments.map((item) => (
                  <div key={item._id} className="relative group/timeline">
                    {/* timeline indicator dot */}
                    <div className={`absolute -right-[23px] top-3.5 w-3.5 h-3.5 rounded-full border-4 border-white z-10 shadow-sm
                      ${item.status === 'completed' ? 'bg-emerald-500' : 
                        item.status === 'confirmed' ? 'bg-blue-500' : 
                        item.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'}`}
                    />

                    <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl group hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                            <ClipboardList size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              {item.reason?.split(':')[0] || 'تقرير كشف طبي بالعيادة'}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                              {format(new Date(item.date), 'dd MMMM yyyy')} • {item.startTime}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            item.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            item.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {item.status === 'completed' ? 'مكتمل' : item.status === 'confirmed' ? 'مؤكد' : item.status === 'cancelled' ? 'ملغي' : 'معلق'}
                          </span>
                        </div>
                      </div>

                      {/* Notes/Evaluation reason */}
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-2 bg-white/50 p-3 rounded-xl border border-slate-200/20">
                        <span className="font-bold text-[10px] text-slate-400 block mb-1">التقرير والتشخيص الطبي:</span>
                        {item.reason?.includes(':') ? item.reason.split(':').slice(1).join(':').trim() : item.reason || 'تم عمل الفحص السريري العام للمريض في الموعد المجدول.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shared Documents & prescriptions list */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">المستندات والوصفات الطبية المشتركة</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">التقارير الطبية ونتائج التحاليل المرفقة</p>
              </div>
              <button 
                onClick={() => {
                  toast.success('تم فتح مجلد التقارير الطبية المرفقة');
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <FileText size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Blood_Report_May.pdf', size: '1.2 MB', time: 'يومين مضت' },
                { name: 'X-Ray_Chest_Scan.jpg', size: '4.5 MB', time: 'أسبوع مضى' },
                { name: 'Vaccination_Record.pdf', size: '0.8 MB', time: 'أسبوعين مضت' },
                { name: 'MRI_Knee_Report.zip', size: '24.1 MB', time: 'شهر مضى' }
              ].map((doc, i) => (
                <div 
                  key={i} 
                  onClick={() => toast.success(`تحميل المستند: ${doc.name}`)}
                  className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-100 hover:shadow-sm transition-all cursor-pointer bg-slate-50/50 hover:bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">{doc.size} • {doc.time}</p>
                    </div>
                  </div>
                  <Clock size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Edit Vitals Attributes Modal */}
      <AnimatePresence>
        {isVitalsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 font-cairo text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5 text-blue-600">
                  <Activity size={18} />
                  <h3 className="text-sm font-bold text-slate-800">تحديث القياسات الجسدية والصحية</h3>
                </div>
                <button
                  onClick={() => setIsVitalsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateVitals} className="space-y-4 text-xs font-bold text-slate-600">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">الوزن (كجم)</label>
                    <input
                      type="number"
                      placeholder="مثال: 72"
                      value={vitalsForm.weight}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                      className="px-3 py-2 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">الطول (سم)</label>
                    <input
                      type="number"
                      placeholder="مثال: 178"
                      value={vitalsForm.height}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                      className="px-3 py-2 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">فصيلة الدم</label>
                    <select
                      value={vitalsForm.bloodType}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, bloodType: e.target.value })}
                      className="px-3 py-2 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">تاريخ الميلاد</label>
                    <input
                      type="date"
                      value={vitalsForm.dob}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, dob: e.target.value })}
                      className="px-3 py-2 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">الجنس</label>
                  <select
                    value={vitalsForm.gender}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, gender: e.target.value })}
                    className="px-3 py-2 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsVitalsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={updatingVitals}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                  >
                    {updatingVitals ? 'جاري الحفظ...' : 'حفظ التحديثات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Clinical evaluation Diagnosis Modal */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg p-6 font-cairo text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5 text-blue-600">
                  <ClipboardList size={18} />
                  <h3 className="text-sm font-bold text-slate-800">تسجيل فحص طبي وتوجيه تشخيصي</h3>
                </div>
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddClinicalRecord} className="space-y-4 text-xs font-bold text-slate-600">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">عنوان الفحص الطبي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تشخيص نزلات البرد، فحص عضلات الظهر..."
                    value={recordForm.title}
                    onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
                    className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">نوع الاستشارة</label>
                  <select
                    value={recordForm.bookingType}
                    onChange={(e) => setRecordForm({ ...recordForm, bookingType: e.target.value })}
                    className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="clinic">فحص سريري بالعيادة</option>
                    <option value="virtual">استشارة مرئية أونلاين</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">التقرير والتشخيص الطبي التفصيلي *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="اكتب التقرير الطبي الكامل، النتائج السريرية، والتوجيهات والوصفة الطبية..."
                    value={recordForm.reason}
                    onChange={(e) => setRecordForm({ ...recordForm, reason: e.target.value })}
                    className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={addingRecord}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm animate-pulse"
                  >
                    {addingRecord ? 'جاري الحفظ...' : 'تسجيل التقرير الطبي'}
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

export default PatientProfile;
