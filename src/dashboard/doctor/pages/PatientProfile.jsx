import React, { useState, useEffect } from 'react';
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
    Clock
} from 'lucide-react';
import { getUserById } from '../../../api/userApi';
import { getOrCreateConversation } from '../../../api/chatApi';
import gsap from 'gsap';

const PatientProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const res = await getUserById(id);
                setPatient(res.data.user);
            } catch (err) {
                console.error('Failed to fetch patient profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatient();
    }, [id]);

    useEffect(() => {
        if (!loading && patient) {
            gsap.from(".profile-card", {
                opacity: 0,
                y: 20,
                duration: 0.6,
                stagger: 0.1,
                ease: "power3.out"
            });
        }
    }, [loading, patient]);

    const handleChat = async () => {
        try {
            const res = await getOrCreateConversation(id);
            const conversation = res.data.conversation;
            navigate(`/chat/${conversation._id}`);
        } catch (err) {
            console.error('Failed to start chat', err);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-500" dir="rtl">جاري تحميل ملف المريض...</div>;
    if (!patient) return <div className="p-8 text-center font-bold text-rose-500" dir="rtl">المريض غير موجود.</div>;

    const online = false;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                >
                    <ChevronLeft size={20} className="rotate-180" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">ملف المريض</h1>
                    <p className="text-sm text-slate-500 font-medium">عرض نظرة عامة طبية مفصلة لـ {patient.name}.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Main Info */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Main Card */}
                    <div className="profile-card bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="relative mb-6">
                            <div className="w-28 h-28 rounded-3xl bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold text-slate-300">
                                {patient.name.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl border-4 border-white shadow-lg flex items-center justify-center ${online ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                <Activity size={14} className="text-white" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">رقم المريض: #MC-{patient._id.substring(0, 6).toUpperCase()}</p>

                        <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${online ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                            {online ? 'متصل الآن' : 'غير متصل'}
                        </div>

                        <div className="grid grid-cols-4 gap-4 w-full mt-8 pt-8 border-t border-slate-50">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">العمر</p>
                                <p className="text-sm font-bold text-slate-800 mt-1">
                                    {patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'غير متوفر'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">الدم</p>
                                <p className="text-sm font-bold text-slate-800 mt-1" dir="ltr">{patient.bloodType || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">الطول</p>
                                <p className="text-sm font-bold text-slate-800 mt-1">{patient.height ? `${patient.height} سم` : '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">الوزن</p>
                                <p className="text-sm font-bold text-slate-800 mt-1">{patient.weight ? `${patient.weight} كجم` : '-'}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleChat}
                            className="w-full mt-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <MessageSquare size={20} />
                            محادثة مع المريض
                        </button>
                    </div>

                    {/* Contact Details */}
                    <div className="profile-card bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">معلومات الاتصال</h3>
                        <div className="flex items-center gap-4 text-slate-600">
                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">الهاتف</p>
                                <p className="text-sm font-bold text-slate-700" dir="ltr">{patient.phone || 'غير متوفر'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600">
                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                                <Mail size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">البريد الإلكتروني</p>
                                <p className="text-sm font-bold text-slate-700 truncate">{patient.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Medical Details */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="profile-card bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                                <Droplet size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الهيموجلوبين</p>
                                <h4 className="text-xl font-bold text-slate-800">14.2 g/dL</h4>
                            </div>
                        </div>
                        <div className="profile-card bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">معدل ضربات القلب</p>
                                <h4 className="text-xl font-bold text-slate-800">72 bpm</h4>
                            </div>
                        </div>
                        <div className="profile-card bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الفحص القادم</p>
                                <h4 className="text-xl font-bold text-slate-800">May 12, 2026</h4>
                            </div>
                        </div>
                    </div>

                    {/* Medical History */}
                    <div className="profile-card bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-bold text-slate-800">التاريخ الطبي</h3>
                            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl">إضافة سجل</button>
                        </div>
                        <div className="space-y-6">
                            {[
                                { title: 'Annual Health Screening', date: 'Mar 15, 2026', doctor: 'Dr. Sarah Wilson', type: 'Checkup' },
                                { title: 'Physical Therapy Session', date: 'Feb 20, 2026', doctor: 'Dr. Michael Chen', type: 'Treatment' },
                                { title: 'Dermatology Consultation', date: 'Jan 12, 2026', doctor: 'Dr. Emily Blunt', type: 'Specialist' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100/50 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                            <ClipboardList size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.date} • {item.doctor}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/50 px-3 py-1.5 rounded-lg">{item.type}</span>
                                        <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Documents & Files */}
                    <div className="profile-card bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-bold text-slate-800">المستندات المشتركة</h3>
                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                <FileText size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'Blood_Report_May.pdf', size: '1.2 MB', time: '2 days ago' },
                                { name: 'X-Ray_Chest_Scan.jpg', size: '4.5 MB', time: '1 week ago' },
                                { name: 'Vaccination_Record.pdf', size: '0.8 MB', time: '2 weeks ago' },
                                { name: 'MRI_Knee_Report.zip', size: '24.1 MB', time: '1 month ago' }
                            ].map((doc, i) => (
                                <div key={i} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-100 hover:shadow-sm transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{doc.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{doc.size} • {doc.time}</p>
                                        </div>
                                    </div>
                                    <Clock size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;
