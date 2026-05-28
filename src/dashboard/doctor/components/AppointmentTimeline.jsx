import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, Video, FileText, Activity, User, HelpCircle } from 'lucide-react';
import getImageUrl from '../../../utils/imageUrl';

const AppointmentTimeline = ({ appointments: rawAppointments = [] }) => {
  const [mappedAppointments, setMappedAppointments] = useState([]);

  useEffect(() => {
    // Filter for today's appointments
    const today = new Date().toLocaleDateString();
    const todayAppts = rawAppointments.filter(
      apt => new Date(apt.date).toLocaleDateString() === today
    );

    const statusMap = {
      'completed': 'مكتمل',
      'pending': 'قيد الانتظار',
      'cancelled': 'ملغي',
      'in-progress': 'جاري حالياً',
    };

    const reasonMap = {
      'Consultation': 'استشارة طبية',
      'Follow-up': 'متابعة دورية',
      'Checkup': 'فحص عام',
      'Emergency': 'حالة طارئة',
    };

    const mapped = todayAppts.map((apt, index) => {
      const rawStatus = apt.status || 'pending';
      const statusArabic = statusMap[rawStatus] || rawStatus;
      
      const rawReason = apt.reason || 'Consultation';
      const reasonArabic = reasonMap[rawReason] || rawReason;

      let action = 'تجهيز الملاحظات';
      let actionIcon = FileText;
      if (rawStatus === 'in-progress') {
        action = 'انضم للاستشارة';
        actionIcon = Video;
      } else if (rawStatus === 'completed') {
        action = 'تجهيز الملاحظات';
        actionIcon = FileText;
      }

      return {
        id: apt._id,
        patient: apt.patient?.name || 'مريض غير معروف',
        time: apt.timeSlot,
        type: reasonArabic,
        status: statusArabic,
        rawStatus: rawStatus,
        action: action,
        actionIcon: actionIcon,
        active: rawStatus === 'in-progress' || (rawStatus === 'pending' && index === 0),
        image: apt.patient?.image || null
      };
    });

    setMappedAppointments(mapped);
  }, [rawAppointments]);

  if (!rawAppointments || (rawAppointments.length === 0 && mappedAppointments.length === 0)) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex items-center justify-center font-bold text-slate-400 text-center" dir="rtl">
        لا توجد مواعيد مجدولة لليوم.
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-bold text-slate-850 tracking-tight font-sans">جدول مواعيد اليوم</h3>
        <button className="flex items-center gap-1.5 text-blue-600 text-sm font-bold hover:gap-2 transition-all">
          عرض التقويم <ChevronLeft size={18} />
        </button>
      </div>

      {/* Timeline List Container */}
      <div className="relative flex-1 pr-12 pl-4 space-y-8">
        {/* Vertical RTL Timeline Line */}
        <div className="absolute right-[23px] top-4 bottom-4 w-[1px] bg-slate-150"></div>

        {mappedAppointments.length === 0 && (
          <p className="text-slate-400 font-medium">لا توجد مواعيد مجدولة اليوم.</p>
        )}

        {mappedAppointments.map((apt) => (
          <div key={apt.id} className="relative">
            {/* Timeline Dot/Icon on the Right side */}
            <div className={`absolute -right-12 top-10 w-12 h-12 flex items-center justify-center z-10`}>
              <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-md transition-colors duration-300 ${
                apt.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-450'
              }`}>
                {apt.active ? <Activity size={14} /> : <User size={14} />}
              </div>
            </div>

            {/* Appointment Card */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${
              apt.active
                ? 'bg-white border-blue-100 shadow-xl shadow-blue-600/5'
                : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {apt.time}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${
                      apt.rawStatus === 'in-progress' ? 'text-emerald-600' :
                      apt.rawStatus === 'completed' ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                      {apt.rawStatus === 'in-progress' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      )}
                      {apt.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-1">
                    {apt.image ? (
                      <img src={getImageUrl(apt.image)} alt="" className="w-10 h-10 rounded-full border border-white shadow-sm object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                        <User size={18} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{apt.patient}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-0.5">
                        <FileText size={12} className="text-slate-400" />
                        {apt.type}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0 self-center">
                  <button className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    apt.active
                      ? 'bg-blue-600 text-white shadow-blue-600/10 hover:bg-blue-700'
                      : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}>
                    {apt.actionIcon && <apt.actionIcon size={16} />}
                    {apt.action}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentTimeline;
