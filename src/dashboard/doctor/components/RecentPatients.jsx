import React, { useState, useEffect } from 'react';
import { MoreVertical, ExternalLink, UserCheck } from 'lucide-react';

const RecentPatients = ({ appointments = [] }) => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    // Extract unique patients from appointments
    const uniquePatientsMap = new Map();
    appointments.forEach(apt => {
      if (apt.patient && !uniquePatientsMap.has(apt.patient._id)) {
        // Simple translation map for reasons
        const reasonMap = {
          'Consultation': 'استشارة طبية',
          'Follow-up': 'متابعة دورية',
          'Checkup': 'فحص عام',
          'Emergency': 'حالة طارئة',
        };
        const rawReason = apt.reason || 'Consultation';
        const reason = reasonMap[rawReason] || rawReason;

        uniquePatientsMap.set(apt.patient._id, {
          id: apt.patient._id.substring(0, 6).toUpperCase(),
          name: apt.patient.name,
          lastVisit: new Date(apt.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
          reason: reason,
        });
      }
    });

    // Take only top 5 recent patients
    setPatients(Array.from(uniquePatientsMap.values()).slice(0, 5));
  }, [appointments]);

  if (!appointments || (appointments.length === 0 && patients.length === 0)) {
    return (
      <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 h-full flex items-center justify-center text-slate-400 font-bold" dir="rtl">
        لا يوجد مرضى مؤخراً.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full" dir="rtl">
      {/* Card Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-850 tracking-tight font-sans">أحدث المرضى</h3>
        <button className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-xs font-bold text-slate-400 tracking-wider">المريض</th>
              <th className="pb-3 text-xs font-bold text-slate-400 tracking-wider">آخر زيارة</th>
              <th className="pb-3 text-xs font-bold text-slate-400 tracking-wider text-left">الملف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {patients.length === 0 && (
              <tr>
                <td colSpan="3" className="py-8 text-center text-slate-450 text-sm font-medium">
                  لا يوجد مرضى مسجلين مؤخراً.
                </td>
              </tr>
            )}
            {patients.map((patient) => (
              <tr key={patient.id} className="group hover:bg-slate-50/40 transition-colors">
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{patient.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider">كود: #{patient.id}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-650">{patient.lastVisit}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5">{patient.reason}</span>
                  </div>
                </td>
                <td className="py-4 text-left">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 inline-flex items-center justify-center">
                    <UserCheck size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-5 text-center border-t border-slate-50">
        <button className="text-blue-600 text-xs font-bold hover:text-blue-700 hover:underline transition-all">
          عرض جميع المرضى
        </button>
      </div>
    </div>
  );
};

export default RecentPatients;
