import React, { useState, useEffect, useCallback } from 'react';
import {
    getAppointments,
    updateAppointmentStatus
} from '../../../api/appointmentApi';
import SmartCalendar from '../../../components/calendar/SmartCalendar';
import {
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar as CalendarIcon,
    User,
    Activity,
    ArrowRight
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import Swal from 'sweetalert2';

const AdminBookings = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAppointments();
            setAppointments(res.data.appointments);
        } catch (err) {
            console.error('Failed to fetch appointments', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllAppointments();
    }, [fetchAllAppointments]);

    const handleStatusChange = async (id, status) => {
        try {
            const result = await Swal.fire({
                title: 'تغيير حالة الحجز',
                text: `هل أنت متأكد من تغيير الحالة إلى ${status}؟`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم',
                cancelButtonText: 'إلغاء'
            });

            if (result.isConfirmed) {
                await updateAppointmentStatus(id, status);
                fetchAllAppointments();
                Swal.fire('تم!', 'تم تحديث الحالة بنجاح.', 'success');
            }
        } catch (err) {
            Swal.fire('خطأ', 'فشل في تحديث الحالة.', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const filteredAppts = appointments.filter(apt => {
        const matchesDate = isSameDay(new Date(apt.date), selectedDate);
        const matchesSearch = (apt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.doctor?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesDate && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">مركز إدارة الحجوزات</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">مراقبة وإدارة جميع المواعيد الطبية عبر النظام</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="بحث عن مريض أو طبيب..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                        <Filter size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <SmartCalendar
                        appointments={appointments}
                        onDateSelect={setSelectedDate}
                        loading={loading}
                    />
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity className="text-blue-600" size={16} />
                            حجوزات {format(selectedDate, 'd MMMM')}
                        </h3>

                        <div className="space-y-4">
                            {filteredAppts.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-slate-400">لا توجد سجلات لهذا اليوم</p>
                                </div>
                            ) : (
                                filteredAppts.map(apt => (
                                    <div key={apt._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {apt.patient?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800">{apt.patient?.name}</h4>
                                                    <p className="text-[10px] text-slate-400">مع د. {apt.doctor?.user?.name}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                <Clock size={10} /> {apt.timeSlot}
                                            </span>
                                            <div className="flex gap-1">
                                                {apt.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(apt._id, 'confirmed')}
                                                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                    >
                                                        <CheckCircle2 size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleStatusChange(apt._id, 'cancelled')}
                                                    className="p-1.5 bg-white border border-slate-200 text-rose-500 rounded-lg hover:bg-rose-50"
                                                >
                                                    <XCircle size={12} />
                                                </button>
                                                <button className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg">
                                                    <MoreVertical size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-3xl text-white">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">إحصائيات سريعة</h4>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <span className="text-2xl font-bold">{appointments.length}</span>
                                <p className="text-[10px] opacity-60 mt-1">إجمالي المواعيد</p>
                            </div>
                            <div>
                                <span className="text-2xl font-bold">{appointments.filter(a => a.status === 'completed').length}</span>
                                <p className="text-[10px] opacity-60 mt-1">جلسات مكتملة</p>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                            عرض التقارير المفصلة <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBookings;
