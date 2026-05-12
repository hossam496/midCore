import React, { useState, useEffect } from 'react';
import { MoreVertical, ExternalLink, Image } from 'lucide-react';
import { getAppointments } from '../../../api/appointmentApi';

const RecentPatients = ({ appointments = [] }) => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    // Extract unique patients from appointments
    const uniquePatientsMap = new Map();
    appointments.forEach(apt => {
      if (apt.patient && !uniquePatientsMap.has(apt.patient._id)) {
        uniquePatientsMap.set(apt.patient._id, {
          id: apt.patient._id.substring(0, 6).toUpperCase(),
          name: apt.patient.name,
          lastVisit: new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          reason: apt.reason || 'Consultation',
        });
      }
    });

    // Take only top 5 recent patients
    setPatients(Array.from(uniquePatientsMap.values()).slice(0, 5));
  }, [appointments]);

  // Loading is handled by Dashboard.jsx
  if (!appointments || appointments.length === 0 && patients.length === 0) {
    return <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 h-full flex items-center justify-center text-slate-400 font-bold">No recent patients.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent Patients</h3>
        <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
              <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Visit</th>
              <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {patients.length === 0 && (
              <tr><td colSpan="3" className="py-8 text-center text-slate-400 text-sm">No recent patients.</td></tr>
            )}
            {patients.map((patient) => (
              <tr key={patient.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{patient.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5">ID: #{patient.id}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-600">{patient.lastVisit}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{patient.reason}</span>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100">
                    <Image size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto pt-6 text-center border-t border-slate-50">
        <button className="text-blue-600 text-xs font-bold hover:underline transition-all">
          View All Patients
        </button>
      </div>
    </div>
  );
};

export default RecentPatients;


