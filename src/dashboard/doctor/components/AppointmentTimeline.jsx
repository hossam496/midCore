import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, ChevronRight, Video, FileText, Activity, User } from 'lucide-react';
import { getAppointments } from '../../../api/appointmentApi';
import getImageUrl from '../../../utils/imageUrl';

const AppointmentTimeline = ({ appointments: rawAppointments = [] }) => {
  const [mappedAppointments, setMappedAppointments] = useState([]);

  useEffect(() => {
    // Filter for today's appointments
    const today = new Date().toLocaleDateString();
    const todayAppts = rawAppointments.filter(
      apt => new Date(apt.date).toLocaleDateString() === today
    );
    
    const mapped = todayAppts.map((apt, index) => ({
      id: apt._id,
      patient: apt.patient?.name,
      time: apt.timeSlot,
      type: apt.reason || 'Consultation',
      status: apt.status,
      action: apt.status === 'in-progress' ? 'Join Consultation' : 'Prepare Notes',
      actionIcon: apt.status === 'in-progress' ? Video : FileText,
      active: apt.status === 'in-progress' || index === 0, 
      image: null 
    }));

    setMappedAppointments(mapped);
  }, [rawAppointments]);

  // Loading is now handled by the parent Dashboard
  if (!rawAppointments || rawAppointments.length === 0 && mappedAppointments.length === 0) {
     return <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex items-center justify-center font-bold text-slate-400 text-center">
       No appointments scheduled for today.
     </div>;
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Today's Schedule</h3>
        <button className="flex items-center gap-1.5 text-blue-600 text-sm font-bold hover:gap-2 transition-all">
          View Calendar <ChevronRight size={18} />
        </button>
      </div>

      <div className="relative flex-1 pl-12 pr-4 space-y-8">
        {/* Vertical Line */}
        <div className="absolute left-[23px] top-4 bottom-4 w-[1px] bg-slate-100"></div>

        {mappedAppointments.length === 0 && (
          <p className="text-slate-400 font-medium">No appointments scheduled for today.</p>
        )}

        {mappedAppointments.map((apt) => (
          <div key={apt.id} className="relative">
            {/* Timeline Dot/Icon */}
            <div className={`absolute -left-12 top-10 w-12 h-12 flex items-center justify-center z-10`}>
              <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-md ${
                apt.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {apt.active ? <Activity size={14} /> : <User size={14} />}
              </div>
            </div>

            {/* Appointment Card */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${
              apt.active 
                ? 'bg-white border-blue-100 shadow-xl shadow-blue-600/5' 
                : 'bg-[#f8fafc] border-slate-100'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {apt.time}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      {apt.active && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>}
                      {apt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    {apt.image && (
                      <img src={getImageUrl(apt.image)} alt="" className="w-9 h-9 rounded-full border border-white shadow-sm" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{apt.patient}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                        <FileText size={12} className="text-slate-400" />
                        {apt.type}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                    apt.active 
                      ? 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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


