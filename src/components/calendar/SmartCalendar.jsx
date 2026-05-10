import React, { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast'; // I'll assume toast exists or use Swal

const SmartCalendar = ({ appointments, onDateSelect, loading }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <CalendarIcon className="text-blue-600" size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {days.map((day, index) => (
                    <div key={index} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, "d");
                const cloneDay = day;

                // Count appointments for this day
                const dayAppts = appointments?.filter(appt =>
                    isSameDay(new Date(appt.date), cloneDay)
                ) || [];

                days.push(
                    <div
                        key={day.toString()}
                        className={`relative h-28 border-r border-b border-slate-100 p-2 cursor-pointer transition-all duration-300
              ${!isSameMonth(day, monthStart) ? "bg-slate-50/30 text-slate-300" : "text-slate-700 bg-white"}
              ${isSameDay(day, selectedDate) ? "ring-2 ring-inset ring-blue-500 z-10" : "hover:bg-blue-50/30"}
            `}
                        onClick={() => {
                            setSelectedDate(cloneDay);
                            onDateSelect(cloneDay);
                        }}
                    >
                        <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg 
              ${isSameDay(day, new Date()) ? "bg-blue-600 text-white" : ""}
            `}>
                            {formattedDate}
                        </span>

                        <div className="mt-2 space-y-1 overflow-y-auto max-h-[60px] scrollbar-hide">
                            {dayAppts.slice(0, 3).map((appt, idx) => (
                                <div
                                    key={idx}
                                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded border truncate
                    ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            appt.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-slate-50 text-slate-600 border-slate-100'}
                  `}
                                >
                                    {appt.startTime} - {appt.patientDetails?.name || appt.patient?.name}
                                </div>
                            ))}
                            {dayAppts.length > 3 && (
                                <div className="text-[8px] font-bold text-slate-400 pl-1.5">
                                    +{dayAppts.length - 3} more
                                </div>
                            )}
                        </div>

                        {dayAppts.length > 0 && isSameMonth(day, monthStart) && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }

        return <div className="bg-white">{rows}</div>;
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderHeader()}
            {renderDays()}
            {loading ? (
                <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                renderCells()
            )}
        </div>
    );
};

export default SmartCalendar;
