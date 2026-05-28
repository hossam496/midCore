import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Heart,
  Printer,
  Trash2,
  Thermometer,
  ShieldAlert,
  Percent,
  Check
} from 'lucide-react';
import { getUserById, updateUserProfile } from '../../../api/userApi';
import { getAppointments, createAppointment } from '../../../api/appointmentApi';
import { getOrCreateConversation } from '../../../api/chatApi';
import { getMyDoctorProfile } from '../../../api/doctorApi';
import { 
  getPrescriptions, 
  createPrescription, 
  deletePrescription, 
  getVitals, 
  createVitalLog, 
  getMedicalDocuments, 
  createMedicalDocument 
} from '../../../api/ehrApi';
import { format } from 'date-fns';
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

  // Active EHR Tab State
  const [activeTab, setActiveTab] = useState('history'); // history | prescriptions | vitals | reports

  // Modal States
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isNewVitalsLogModalOpen, setIsNewVitalsLogModalOpen] = useState(false);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);

  // Single Prescription to print
  const [printRx, setPrintRx] = useState(null);

  // Patient Base Vitals Form State
  const [vitalsForm, setVitalsForm] = useState({
    bloodType: 'A+',
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

  // Prescription Form State
  const [rxForm, setRxForm] = useState({
    name: '',
    dosage: 'كبسولة واحدة',
    frequency: '3 مرات يومياً (كل 8 ساعات)',
    duration: '7 أيام',
    instructions: 'بعد الأكل مباشرة'
  });

  // Vitals Log Form State
  const [vitalsLogForm, setVitalsLogForm] = useState({
    pulse: '72',
    bp: '120/80',
    sugar: '95',
    temp: '36.8',
    oxygen: '98',
    note: 'المؤشرات طبيعية ومستقرة'
  });

  // Document Upload State
  const [docForm, setDocForm] = useState({
    name: '',
    size: '1.5 MB'
  });

  // Custom Symptoms for Quick Adding
  const symptomTags = ['صداع', 'حمى شديدة', 'سعال حاد', 'ضيق تنفس', 'ألم بالصدر', 'ألم بالمفاصل', 'إرهاق عام', 'ألم بالظهر', 'غثيان'];

  // Common Medications for Quick Select
  const commonDrugs = [
    'Amoxicillin (أموكسيسيلين)',
    'Panadol Extra (بنادول إكسترا)',
    'Metformin (ميتفورمين)',
    'Lipitor (ليبيتور)',
    'Ventolin Inhaler (فنتولين)',
    'Nexium (نيكسيوم)',
    'Augmentin (أوجمنتين)',
    'Cataflam (كاتافلام)',
    'Zyrtec (زيرتيك)'
  ];

  // EHR Database States
  const [prescriptions, setPrescriptions] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [documents, setDocuments] = useState([]);

  const fetchPatientAndAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const [
        patientRes, 
        apptsRes, 
        doctorRes,
        prescriptionsRes,
        vitalsRes,
        documentsRes
      ] = await Promise.all([
        getUserById(id),
        getAppointments(),
        getMyDoctorProfile().catch(() => null),
        getPrescriptions(id).catch(() => ({ data: { prescriptions: [] } })),
        getVitals(id).catch(() => ({ data: { vitals: [] } })),
        getMedicalDocuments(id).catch(() => ({ data: { documents: [] } }))
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

      // Set EHR lists from backend responses
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
      setVitalsHistory(vitalsRes.data.vitals || []);
      setDocuments(documentsRes.data.documents || []);

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

  // Calculate BMI and Categories
  const bmi = useMemo(() => {
    if (!patient || !patient.weight || !patient.height) return null;
    const heightM = patient.height / 100;
    return (patient.weight / (heightM * heightM)).toFixed(1);
  }, [patient]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) {
      return { label: 'تحت الوزن الطبيعي (نحافة)', color: 'text-amber-500 bg-amber-50 border-amber-100', bg: 'bg-amber-500', feedback: 'ينصح بزيادة السعرات الحرارية الصحية واستشارة خبير تغذية لتناول وجبات مغذية متوازنة.' };
    }
    if (val < 25) {
      return { label: 'وزن مثالي وصحي', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bg: 'bg-emerald-500', feedback: 'ممتاز! وزنك مثالي ومتناسق. استمر في الحفاظ على هذا معدل الرائع بنظام صحي.' };
    }
    if (val < 30) {
      return { label: 'زيادة طفيفة في الوزن', color: 'text-orange-500 bg-orange-50 border-orange-100', bg: 'bg-orange-500', feedback: 'ينصح بتقليل النشويات والسكريات وزيادة النشاط الرياضي اليومي لتفادي السمنة.' };
    }
    return { label: 'سمنة مفرطة', color: 'text-rose-500 bg-rose-50 border-rose-100', bg: 'bg-rose-500', feedback: 'تنبيه: ينصح باتباع نظام غذائي متكامل لإنقاص الوزن والمتابعة الدورية مع الطبيب لحماية القلب.' };
  }, [bmi]);

  // Get latest vital metrics from logs
  const latestVitals = useMemo(() => {
    if (vitalsHistory.length === 0) {
      return { pulse: 72, bp: '120/80', sugar: 95, temp: 36.8, oxygen: 98 };
    }
    return vitalsHistory[0];
  }, [vitalsHistory]);

  // Handle direct messaging redirect
  const handleChat = async () => {
    try {
      await getOrCreateConversation(id);
      navigate(`/doctor/messages`);
    } catch (err) {
      console.error('Failed to start chat', err);
      toast.error('فشل في بدء المحادثة مع المريض');
    }
  };

  // Save Vitals Update to DB
  const handleUpdateVitals = async (e) => {
    e.preventDefault();
    const wt = parseFloat(vitalsForm.weight);
    const ht = parseFloat(vitalsForm.height);

    if (wt && (wt < 10 || wt > 300)) {
      toast.error('الرجاء إدخال وزن منطقي بين 10 و 300 كجم');
      return;
    }
    if (ht && (ht < 40 || ht > 250)) {
      toast.error('الرجاء إدخال طول منطقي بين 40 و 250 سم');
      return;
    }
    if (vitalsForm.dob) {
      const selectedDate = new Date(vitalsForm.dob);
      if (selectedDate > new Date()) {
        toast.error('تاريخ الميلاد لا يمكن أن يكون في المستقبل');
        return;
      }
    }

    try {
      setUpdatingVitals(true);
      await updateUserProfile(id, vitalsForm);
      toast.success('تم تحديث البيانات الحيوية بنجاح');
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

  // Add prescription to MERN backend
  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!rxForm.name) {
      toast.error('الرجاء إدخال اسم الدواء');
      return;
    }

    try {
      const payload = {
        patientId: id,
        name: rxForm.name,
        dosage: rxForm.dosage,
        frequency: rxForm.frequency,
        duration: rxForm.duration,
        instructions: rxForm.instructions,
        date: format(new Date(), 'yyyy-MM-dd')
      };

      const res = await createPrescription(payload);
      setPrescriptions([res.data.prescription, ...prescriptions]);
      toast.success('تمت إضافة الوصفة الطبية بنجاح');
      setIsPrescriptionModalOpen(false);
      setRxForm({
        name: '',
        dosage: 'كبسولة واحدة',
        frequency: '3 مرات يومياً (كل 8 ساعات)',
        duration: '7 أيام',
        instructions: 'بعد الأكل مباشرة'
      });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إضافة الوصفة الطبية');
    }
  };

  // Delete a prescription from MERN backend
  const handleDeletePrescription = (rxId) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من استرجاع هذه الوصفة بعد الحذف!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'نعم، احذفها',
      cancelButtonText: 'إلغاء'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deletePrescription(rxId);
          setPrescriptions(prev => prev.filter(rx => (rx._id || rx.id) !== rxId));
          toast.success('تم حذف الوصفة الطبية بنجاح');
        } catch (err) {
          console.error(err);
          toast.error('حدث خطأ أثناء حذف الوصفة الطبية');
        }
      }
    });
  };

  // Add vital logs to MERN backend
  const handleAddVitalsLog = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patientId: id,
        pulse: parseInt(vitalsLogForm.pulse) || 72,
        bp: vitalsLogForm.bp || '120/80',
        sugar: parseInt(vitalsLogForm.sugar) || 95,
        temp: parseFloat(vitalsLogForm.temp) || 36.8,
        oxygen: parseInt(vitalsLogForm.oxygen) || 98,
        date: format(new Date(), 'yyyy-MM-dd'),
        note: vitalsLogForm.note
      };

      const res = await createVitalLog(payload);
      setVitalsHistory([res.data.log, ...vitalsHistory]);
      toast.success('تم تسجيل المؤشرات الحيوية بنجاح');
      setIsNewVitalsLogModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تسجيل مؤشرات القياس');
    }
  };

  // Add medical document to MERN backend
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docForm.name) {
      toast.error('الرجاء إدخال اسم المستند');
      return;
    }

    try {
      const docName = docForm.name.endsWith('.pdf') || docForm.name.endsWith('.jpg') ? docForm.name : `${docForm.name}.pdf`;
      const payload = {
        patientId: id,
        name: docName,
        size: docForm.size,
        date: format(new Date(), 'yyyy-MM-dd')
      };

      const res = await createMedicalDocument(payload);
      setDocuments([res.data.document, ...documents]);
      toast.success('تمت إضافة المستند بنجاح');
      setIsNewDocModalOpen(false);
      setDocForm({ name: '', size: '1.5 MB' });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إضافة الملف المرفق');
    }
  };

  // Print single Rx script function
  const handlePrintRx = (rx) => {
    setPrintRx(rx);
    setTimeout(() => {
      window.print();
      setPrintRx(null);
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-center font-bold text-slate-500 font-cairo" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold">جاري تحميل السجل الطبي الشامل للمريض...</span>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center font-bold text-rose-500 font-cairo text-sm" dir="rtl">
        الملف الطبي الإلكتروني المطلوب غير متوفر أو تم نقله.
      </div>
    );
  }

  return (
    <>
      {/* Heartbeat pulse stylesheet injection */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          20%, 60% { transform: scale(1.18); }
          40%, 80% { transform: scale(1.06); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.3s infinite;
        }
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print-pad-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Screen Render Container */}
      <div className="print:hidden space-y-8 animate-in fade-in duration-500 pb-12 font-cairo text-right" dir="rtl">
        
        {/* Header Back bar */}
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={18} className="rotate-180" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">الملف الصحي الإلكتروني للمريض (EHR)</h1>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">مراجعة الفحوصات الجسدية، تشخيصات العيادة والروشتات الطبية المعتمدة</p>
            </div>
          </div>
          <span className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-xs font-bold shadow-inner">
            نمط الطبيب المعالج
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Personal Profile Details */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Attributes Card */}
            <div className="bg-white rounded-3xl border border-slate-150/70 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden group hover:border-blue-100 transition-all duration-300">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <div className="relative mb-5 mt-2">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md flex items-center justify-center text-3xl font-extrabold text-white transform group-hover:scale-105 transition-all">
                  {patient.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
                  <Activity size={12} className="text-white" />
                </div>
              </div>

              <h2 className="text-base font-bold text-slate-800">{patient.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">رقم السجل: #MC-{patient._id.substring(0, 6).toUpperCase()}</p>

              <div className="flex items-center gap-1.5 mt-3 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>نشط في العيادة</span>
              </div>

              {/* Vitals physical dimensions */}
              <div className="grid grid-cols-4 gap-1.5 w-full mt-7 pt-5 border-t border-slate-50 text-center">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">العمر</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{calculateAge(patient.dob)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">الدم</p>
                  <p className="text-xs font-bold text-slate-700 mt-1" dir="ltr">{patient.bloodType || 'A+'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">الطول</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{patient.height ? `${patient.height} سم` : 'غير مسجل'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">الوزن</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{patient.weight ? `${patient.weight} كجم` : 'غير مسجل'}</p>
                </div>
              </div>

              {/* BMI Custom Visual Gauge */}
              {bmi ? (
                <div className="w-full mt-6 bg-slate-50/70 border border-slate-100 p-4 rounded-2xl text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">مؤشر كتلة الجسم (BMI)</span>
                    <span className="text-xs font-bold text-blue-600 font-mono">{bmi}</span>
                  </div>
                  
                  {/* Gauge line */}
                  <div className="w-full mt-3 space-y-1.5">
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-emerald-500 to-rose-500 rounded-full relative shadow-inner">
                      <div 
                        className="absolute w-3 h-3 bg-slate-800 border border-white rounded-full -top-[3px] shadow-sm transform -translate-x-1/2 transition-all duration-700"
                        style={{ left: `${Math.min(Math.max(((parseFloat(bmi) - 15) / (40 - 15)) * 100, 0), 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[7px] font-extrabold text-slate-400">
                      <span>15 (نحافة)</span>
                      <span>22 (مثالي)</span>
                      <span>30 (سمنة)</span>
                    </div>
                  </div>

                  <div className={`mt-3.5 px-3 py-2 rounded-xl border text-[9px] font-bold ${bmiCategory?.color}`}>
                    <div className="flex items-center gap-1">
                      <ShieldAlert size={10} />
                      <span className="font-extrabold">{bmiCategory?.label}</span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-600 leading-relaxed">{bmiCategory?.feedback}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full mt-6 bg-slate-50 border border-dashed border-slate-200 p-4 rounded-2xl text-[10px] text-slate-400 font-bold">
                  أدخل الوزن والطول لحساب تلقائي لمؤشر كتلة الجسم (BMI).
                </div>
              )}

              {/* Quick Action buttons */}
              <div className="w-full mt-6 space-y-2.5">
                <button
                  onClick={() => setIsVitalsModalOpen(true)}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  تحديث المؤشرات الأساسية
                </button>
                
                <button
                  onClick={handleChat}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>بدء محادثة فورية</span>
                </button>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="bg-white rounded-3xl border border-slate-150/70 shadow-sm p-5 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2.5">معلومات التواصل المسجلة</h3>
              
              {patient.phone && (
                <div className="flex items-center gap-3.5 text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                    <Phone size={15} />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">الهاتف المحمول</p>
                    <p className="text-xs font-bold text-slate-700 font-mono mt-0.5" dir="ltr">{patient.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3.5 text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                  <Mail size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">البريد الإلكتروني</p>
                  <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{patient.email}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic EHR Medical Panels */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              
              {/* Pulse Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-rose-100 transition-all">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl animate-heartbeat">
                  <Heart size={18} fill="#f43f5e" />
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide mt-2">معدل النبض</span>
                <h4 className="text-sm font-bold text-slate-800 mt-1 font-mono">{latestVitals.pulse} <span className="text-[8px] text-slate-400">bpm</span></h4>
              </div>

              {/* BP Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-blue-100 transition-all">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                  <Activity size={18} />
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide mt-2">ضغط الدم</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1.5 font-mono">{latestVitals.bp} <span className="text-[8px] text-slate-400">mmHg</span></h4>
              </div>

              {/* Sugar Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-purple-100 transition-all">
                <div className="p-2 bg-purple-50 text-purple-500 rounded-xl">
                  <Droplet size={18} />
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide mt-2">السكر العشوائي</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1.5 font-mono">{latestVitals.sugar} <span className="text-[8px] text-slate-400">mg/dL</span></h4>
              </div>

              {/* Temp Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-amber-100 transition-all">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                  <Thermometer size={18} />
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide mt-2">الحرارة</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1.5 font-mono">{latestVitals.temp} <span className="text-[8px] text-slate-400">°C</span></h4>
              </div>

              {/* Oxygen Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 md:col-span-1 flex flex-col items-center justify-center text-center group hover:border-emerald-100 transition-all">
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                  <Percent size={16} className="stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide mt-2">أكسجين الدم</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1.5 font-mono">{latestVitals.oxygen} <span className="text-[8px] text-slate-400">% SpO2</span></h4>
              </div>

            </div>

            {/* EHR Tabs Bar Layout */}
            <div className="bg-white rounded-3xl border border-slate-150/70 shadow-sm overflow-hidden">
              
              {/* Tab Navigation header */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1.5">
                {[
                  { id: 'history', label: 'السجل والزيارات الطبية', count: appointments.length, icon: ClipboardList },
                  { id: 'prescriptions', label: 'الوصفات الطبية والروشتات', count: prescriptions.length, icon: FileText },
                  { id: 'vitals', label: 'لوحة القياسات والتحاليل', count: vitalsHistory.length, icon: TrendingUp },
                  { id: 'reports', label: 'التقارير والمستندات', count: documents.length, icon: FileText }
                ].map((tab) => {
                  const Icon = tab.icon || ClipboardList;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                        isActive 
                          ? 'bg-white border-slate-200 shadow-sm text-blue-600' 
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-blue-500 animate-pulse' : 'text-slate-400'} />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono ${
                          isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/70 text-slate-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents Frame */}
              <div className="p-6 sm:p-8">
                
                {/* 1. Tab: Historical Clinical Timeline */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">التاريخ الطبي وسجلات المراجعات بالعيادة</h3>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">سجل شامل للزيارات والفحوصات المسجلة لهذا المريض</p>
                      </div>
                      
                      <button 
                        onClick={() => setIsRecordModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>تسجيل فحص طبي</span>
                      </button>
                    </div>

                    {appointments.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <ClipboardList className="mx-auto text-slate-350 mb-3" size={32} />
                        <p className="font-semibold">لا يوجد أي مراجعات أو تقارير طبية مسجلة مسبقاً.</p>
                        <button
                          onClick={() => setIsRecordModalOpen(true)}
                          className="mt-3 text-xs text-blue-600 font-bold hover:underline"
                        >
                          سجل أول تشخيص طبي للمريض بالضغط هنا
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6 relative border-r-2 border-slate-100 pr-5 mr-2">
                        {appointments.map((item) => (
                          <div key={item._id} className="relative">
                            
                            {/* status color dots */}
                            <div className={`absolute -right-[24px] top-3.5 w-3.5 h-3.5 rounded-full border-4 border-white z-10 shadow-sm
                              ${item.status === 'completed' ? 'bg-emerald-500' : 
                                item.status === 'confirmed' ? 'bg-blue-500' : 
                                item.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'}`}
                            />

                            <div className="bg-slate-50/80 border border-slate-100/70 p-5 rounded-2xl hover:bg-white hover:shadow-md hover:border-blue-150/70 transition-all duration-300">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                                    <ClipboardList size={18} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800">
                                      {item.reason?.split(':')[0] || 'تقرير مراجعة طبية عامة'}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                                      {format(new Date(item.date), 'dd MMMM yyyy')} • {item.startTime} {item.bookingType === 'virtual' ? '(عن بعد)' : '(بالعيادة)'}
                                    </p>
                                  </div>
                                </div>
                                
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border self-start sm:self-center ${
                                  item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  item.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  item.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                  {item.status === 'completed' ? 'مكتمل' : item.status === 'confirmed' ? 'مؤكد' : item.status === 'cancelled' ? 'ملغي' : 'معلق'}
                                </span>
                              </div>

                              <div className="bg-white/90 border border-slate-150/50 p-3.5 rounded-xl text-xs text-slate-650 leading-relaxed font-semibold">
                                <span className="font-bold text-[9px] text-slate-400 block mb-1.5 tracking-wide">النتائج والتشخيص الطبي:</span>
                                {item.reason?.includes(':') ? item.reason.split(':').slice(1).join(':').trim() : item.reason || 'تم عمل الفحص السريري العام ومتابعة الحالة الصحية للمريض.'}
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Tab: Prescription Pad & Printable script builder */}
                {activeTab === 'prescriptions' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">وصف الأدوية والروشتات الطبية المعتمدة</h3>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">تحرير وإصدار الوصفات الطبية للمريض وطباعتها على ورق المستشفى</p>
                      </div>
                      
                      <button 
                        onClick={() => setIsPrescriptionModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>تحرير روشتة جديدة</span>
                      </button>
                    </div>

                    {prescriptions.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <FileText className="mx-auto text-slate-350 mb-3" size={32} />
                        <p className="font-semibold">لا يوجد روشتات أو وصفات علاجية مسجلة حالياً.</p>
                        <button
                          onClick={() => setIsPrescriptionModalOpen(true)}
                          className="mt-3 text-xs text-blue-600 font-bold hover:underline"
                        >
                          اضغط هنا لإصدار أول روشتة للمريض الآن
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prescriptions.map((rx) => (
                          <div 
                            key={rx._id || rx.id}
                            className="bg-slate-50/80 border border-slate-100 p-5 rounded-2xl relative group flex flex-col justify-between hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-3 gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <FileText size={14} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800">{rx.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">تاريخ الإصدار: {rx.date}</p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleDeletePrescription(rx._id || rx.id)}
                                  className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div className="bg-white/80 border border-slate-150/40 p-3 rounded-xl space-y-1.5 text-[10px] font-bold text-slate-600 mt-2">
                                <p><span className="text-slate-400 font-semibold">الجرعة:</span> {rx.dosage}</p>
                                <p><span className="text-slate-400 font-semibold">التكرار:</span> {rx.frequency}</p>
                                <p><span className="text-slate-400 font-semibold">المدة:</span> {rx.duration}</p>
                                {rx.instructions && (
                                  <p className="border-t border-slate-100 pt-1.5 mt-1.5 text-slate-500 font-normal leading-relaxed">
                                    <span className="text-slate-400 font-bold block mb-0.5 text-[8px]">تعليمات الاستخدام:</span>
                                    {rx.instructions}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handlePrintRx(rx)}
                              className="mt-4 w-full py-2 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200/70 hover:border-blue-200/50 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 text-slate-600 shadow-sm transition-all"
                            >
                              <Printer size={12} />
                              <span>طباعة الروشتة الرسمية</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Tab: Historical Vitals Logs & Indicators */}
                {activeTab === 'vitals' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">سجل التحاليل والمؤشرات الحيوية التاريخية</h3>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">رصد ومراقبة نبض القلب، ضغط الدم، السكري والأكسجين المسجلة دورياً</p>
                      </div>
                      
                      <button 
                        onClick={() => setIsNewVitalsLogModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>تسجيل قياس جديد</span>
                      </button>
                    </div>

                    {vitalsHistory.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <TrendingUp className="mx-auto text-slate-350 mb-3" size={32} />
                        <p className="font-semibold">لا يوجد قياسات حيوية سابقة مسجلة مسبقاً.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-right border-collapse text-xs font-semibold text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                              <th className="p-3.5">تاريخ القياس</th>
                              <th className="p-3.5">النبض (bpm)</th>
                              <th className="p-3.5">ضغط الدم</th>
                              <th className="p-3.5">السكري (mg/dL)</th>
                              <th className="p-3.5">الحرارة (°C)</th>
                              <th className="p-3.5">الأكسجين</th>
                              <th className="p-3.5">ملاحظات التقييم</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {vitalsHistory.map((log) => (
                              <tr key={log._id || log.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">{log.date}</td>
                                <td className="p-3.5 font-bold font-mono">{log.pulse}</td>
                                <td className="p-3.5 font-bold font-mono">{log.bp}</td>
                                <td className="p-3.5 font-bold font-mono">{log.sugar}</td>
                                <td className="p-3.5 font-bold font-mono">{log.temp}</td>
                                <td className="p-3.5 font-bold font-mono text-emerald-600">{log.oxygen}%</td>
                                <td className="p-3.5 text-slate-400 font-normal">{log.note || 'مستقر'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Tab: Shared Documents & Reports File Manager */}
                {activeTab === 'reports' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">التقارير الطبية والمستندات المرفقة بالملف</h3>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">تحميل ومعاينة نتائج التحاليل المخبرية والأشعة السينية</p>
                      </div>
                      
                      <button 
                        onClick={() => setIsNewDocModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>إضافة مستند طبي</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div 
                          key={doc._id || doc.id} 
                          onClick={() => toast.success(`بدء تحميل المستند: ${doc.name}`)}
                          className="p-4 border border-slate-150/70 rounded-2xl flex items-center justify-between group hover:border-blue-150 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-white duration-300"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1">{doc.size} • {doc.time || doc.date}</p>
                            </div>
                          </div>
                          <Clock size={14} className="text-slate-350 group-hover:text-blue-500 transition-colors shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================== */}
        {/* MODALS RENDERING */}
        {/* ==================================================== */}

        {/* 1. Modal: Edit Vitals Base Parameters */}
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
                    <h3 className="text-sm font-bold text-slate-800">تحديث القياسات الجسدية والصحية للملف</h3>
                  </div>
                  <button
                    onClick={() => setIsVitalsModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-405 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleUpdateVitals} className="space-y-4 text-xs font-bold text-slate-650">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">الوزن (كجم)</label>
                      <input
                        type="number"
                        placeholder="مثال: 72"
                        value={vitalsForm.weight}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                        className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">الطول (سم)</label>
                      <input
                        type="number"
                        placeholder="مثال: 178"
                        value={vitalsForm.height}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                        className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">فصيلة الدم</label>
                      <select
                        value={vitalsForm.bloodType}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, bloodType: e.target.value })}
                        className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
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
                        className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">الجنس</label>
                    <select
                      value={vitalsForm.gender}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, gender: e.target.value })}
                      className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsVitalsModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={updatingVitals}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      {updatingVitals ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. Modal: Add Clinical Diagnoses / record */}
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
                    <h3 className="text-sm font-bold text-slate-800">تسجيل فحص طبي وتوجيه تشخيصي للمريض</h3>
                  </div>
                  <button
                    onClick={() => setIsRecordModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddClinicalRecord} className="space-y-4.5 text-xs font-bold text-slate-650">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">عنوان التشخيص الطبي الرئيسي *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: فحص نزلات البرد، فحص عضلات الظهر الدوري..."
                      value={recordForm.title}
                      onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Predefined clickable symptom tags */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-400">أعراض سريعة شائعة (اضغط للإضافة للتقرير):</label>
                    <div className="flex flex-wrap gap-1.5">
                      {symptomTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setRecordForm(prev => ({
                              ...prev,
                              reason: prev.reason ? `${prev.reason} - يعاني من ${tag}` : `يعاني من ${tag}`
                            }));
                          }}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-650 hover:border-blue-150 rounded-lg text-[9px] text-slate-500 font-bold transition-all"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">نوع الكشف / المقابلة</label>
                    <select
                      value={recordForm.bookingType}
                      onChange={(e) => setRecordForm({ ...recordForm, bookingType: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="clinic">زيارة سريرية للعيادة</option>
                      <option value="virtual">استشارة مرئية أونلاين</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">التقرير والتشخيص الطبي الكامل *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="صف بالتفصيل النتائج السريرية، الوصفة الطبية اللازمة، وتوجيهات الرعاية الطبية..."
                      value={recordForm.reason}
                      onChange={(e) => setRecordForm({ ...recordForm, reason: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsRecordModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={addingRecord}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      {addingRecord ? 'جاري التسجيل...' : 'تسجيل التقرير الطبي'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. Modal: Add Rx Prescription */}
        <AnimatePresence>
          {isPrescriptionModalOpen && (
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
                    <FileText size={18} />
                    <h3 className="text-sm font-bold text-slate-800">تحرير وإصدار روشتة طبية (Rx)</h3>
                  </div>
                  <button
                    onClick={() => setIsPrescriptionModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddPrescription} className="space-y-4 text-xs font-bold text-slate-650">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">اسم الدواء الكيميائي / التجاري *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: Panadol, Amoxicillin..."
                      value={rxForm.name}
                      onChange={(e) => setRxForm({ ...rxForm, name: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                    />

                    {/* Quick Drug Suggestions list */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {commonDrugs.map((med) => (
                        <button
                          key={med}
                          type="button"
                          onClick={() => setRxForm(prev => ({ ...prev, name: med }))}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-[8px] text-slate-500 rounded border border-slate-200 hover:text-blue-600 transition-colors"
                        >
                          {med.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">الجرعة المحددة</label>
                    <input
                      type="text"
                      value={rxForm.dosage}
                      onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">معدل التكرار يومياً</label>
                      <select
                        value={rxForm.frequency}
                        onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}
                        className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="مرة واحدة يومياً">مرة واحدة يومياً</option>
                        <option value="مرتين يومياً (كل 12 ساعة)">مرتين يومياً (12 ساعة)</option>
                        <option value="3 مرات يومياً (كل 8 ساعات)">3 مرات يومياً (8 ساعات)</option>
                        <option value="4 مرات يومياً (كل 6 ساعات)">4 مرات يومياً (6 ساعات)</option>
                        <option value="عند اللزوم">عند اللزوم</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">مدة استخدام العلاج</label>
                      <select
                        value={rxForm.duration}
                        onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })}
                        className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="3 أيام">3 أيام</option>
                        <option value="5 أيام">5 أيام</option>
                        <option value="7 أيام">7 أيام</option>
                        <option value="10 أيام">10 أيام</option>
                        <option value="أسبوعين">أسبوعين</option>
                        <option value="شهر كامل">شهر كامل</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">تعليمات وتوجيهات الاستخدام</label>
                    <textarea
                      rows={2.5}
                      placeholder="مثال: بعد الأكل مباشرة، يفضل مع الكثير من الماء..."
                      value={rxForm.instructions}
                      onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsPrescriptionModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      إصدار وإعتماد الدواء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4. Modal: Log New Vitals Historical Metrics */}
        <AnimatePresence>
          {isNewVitalsLogModalOpen && (
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
                    <TrendingUp size={18} />
                    <h3 className="text-sm font-bold text-slate-800">تسجيل قراءة مؤشرات حيوية جديدة</h3>
                  </div>
                  <button
                    onClick={() => setIsNewVitalsLogModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddVitalsLog} className="space-y-4 text-xs font-bold text-slate-650">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">معدل نبض القلب (bpm)</label>
                      <input
                        type="number"
                        required
                        value={vitalsLogForm.pulse}
                        onChange={(e) => setVitalsLogForm({ ...vitalsLogForm, pulse: e.target.value })}
                        className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">ضغط الدم (مثال: 120/80)</label>
                      <input
                        type="text"
                        required
                        value={vitalsLogForm.bp}
                        onChange={(e) => setVitalsLogForm({ ...vitalsLogForm, bp: e.target.value })}
                        className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">السكري (mg/dL)</label>
                      <input
                        type="number"
                        required
                        value={vitalsLogForm.sugar}
                        onChange={(e) => setVitalsLogForm({ ...vitalsLogForm, sugar: e.target.value })}
                        className="px-2 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">الحرارة (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={vitalsLogForm.temp}
                        onChange={(e) => setVitalsLogForm({ ...vitalsLogForm, temp: e.target.value })}
                        className="px-2 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">أكسجين الدم (%)</label>
                      <input
                        type="number"
                        required
                        value={vitalsLogForm.oxygen}
                        onChange={(e) => setVitalsLogForm({ ...vitalsLogForm, oxygen: e.target.value })}
                        className="px-2 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">ملاحظات الطبيب حول المؤشر</label>
                    <input
                      type="text"
                      placeholder="مثال: مستقر وبصحة جيدة..."
                      value={vitalsLogForm.note}
                      onChange={(e) => setVitalsLogForm({ ...vitalsLogForm, note: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsNewVitalsLogModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      تسجيل البيانات
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 5. Modal: Add New Medical Document */}
        <AnimatePresence>
          {isNewDocModalOpen && (
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
                    <FileText size={18} />
                    <h3 className="text-sm font-bold text-slate-800">إضافة مستند أو تقرير طبي مرفق</h3>
                  </div>
                  <button
                    onClick={() => setIsNewDocModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddDocument} className="space-y-4 text-xs font-bold text-slate-650">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">اسم الملف أو التقرير *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: Blood_Report_June, X-Ray_Scan..."
                      value={docForm.name}
                      onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                      className="px-3.5 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">حجم الملف التقديري</label>
                    <select
                      value={docForm.size}
                      onChange={(e) => setDocForm({ ...docForm, size: e.target.value })}
                      className="px-3 py-2.5 w-full bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="1.0 MB">1.0 MB</option>
                      <option value="2.5 MB">2.5 MB</option>
                      <option value="4.2 MB">4.2 MB</option>
                      <option value="12.0 MB">12.0 MB</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsNewDocModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      إرفاق المستند الطبي
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* ==================================================== */}
      {/* PROFESSIONAL RX PRINTABLE CONTAINER */}
      {/* ==================================================== */}
      <div className="hidden print:block print-pad-area font-cairo text-slate-800 p-8 max-w-4xl mx-auto text-right" dir="rtl">
        {/* Printable Hospital Header */}
        <div className="flex justify-between items-center border-b-2 border-blue-600 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">MC</div>
            <div>
              <h1 className="text-xl font-extrabold text-blue-600">بوابة ميدكور الطبية</h1>
              <p className="text-[10px] text-slate-400 font-bold">MedCore Medical Hospital Portal</p>
            </div>
          </div>
          <div className="text-left text-[10px] font-bold text-slate-500" dir="ltr">
            <p>Tel: 920002131</p>
            <p>Email: support@medcore.com</p>
            <p>Web: www.medcore.com</p>
          </div>
        </div>

        {/* Doctor & Patient info block */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-[10px] font-bold mb-8">
          <div className="space-y-1.5">
            <p className="text-slate-400">الطبيب المعالج:</p>
            <p className="text-slate-800 text-xs font-black">{doctor?.name || 'د. حسام البسيوني'}</p>
            <p className="text-slate-500 text-[9px]">استشاري الرعاية الصحية الشاملة والطب الباطني</p>
          </div>
          <div className="space-y-1.5 text-left" dir="ltr">
            <p className="text-slate-400 text-right">المريض المعني:</p>
            <p className="text-slate-800 text-xs font-black text-right">{patient?.name}</p>
            <p className="text-slate-500 text-[9px] text-right">العمر: {calculateAge(patient?.dob)} | فصيلة الدم: {patient?.bloodType || 'A+'}</p>
          </div>
        </div>

        {/* RX Prescription contents */}
        <div className="mb-14">
          <span className="text-5xl font-serif text-blue-600 font-extrabold block mb-6">Rₓ</span>
          <table className="w-full text-right border-collapse text-xs font-bold">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-400 text-[9px] uppercase">
                <th className="pb-3 text-right">اسم المستحضر الطبي والجرعة</th>
                <th className="pb-3 text-right">معدل التكرار</th>
                <th className="pb-3 text-right">فترة العلاج</th>
                <th className="pb-3 text-left">التوجيهات والاستخدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {printRx ? (
                <tr>
                  <td className="py-4 text-slate-900 font-black text-xs">{printRx.name} - {printRx.dosage}</td>
                  <td className="py-4 text-slate-700">{printRx.frequency}</td>
                  <td className="py-4 text-slate-700">{printRx.duration}</td>
                  <td className="py-4 text-slate-500 text-left font-semibold">{printRx.instructions || 'تؤخذ مع الماء الكافي'}</td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <tr key={rx._id || rx.id}>
                    <td className="py-4 text-slate-900 font-black text-xs">{rx.name} - {rx.dosage}</td>
                    <td className="py-4 text-slate-700">{rx.frequency}</td>
                    <td className="py-4 text-slate-700">{rx.duration}</td>
                    <td className="py-4 text-slate-500 text-left font-semibold">{rx.instructions || 'تؤخذ مع الماء الكافي'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Hospital Print footer */}
        <div className="flex justify-between items-end mt-28 pt-8 border-t border-slate-200">
          <div>
            <p className="text-[9px] text-slate-400 font-bold">تاريخ إصدار الروشتة</p>
            <p className="text-xs text-slate-800 font-black mt-1 font-mono">{format(new Date(), 'yyyy-MM-dd')}</p>
          </div>
          <div className="text-center">
            <div className="w-36 h-0.5 bg-slate-350 mb-2"></div>
            <p className="text-xs font-black text-slate-850">توقيع وختم الطبيب المعالج</p>
            <p className="text-[9px] text-slate-400 font-bold mt-1">{doctor?.name || 'د. حسام البسيوني'}</p>
          </div>
        </div>
      </div>
    </>
  );
};

// Simple Fallback Folder Item icon to prevent missing imports
const FolderItemIcon = ({ size, className }) => {
  return <FileText size={size} className={className} />;
};

export default PatientProfile;
