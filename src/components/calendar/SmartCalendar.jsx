import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Phone, 
  User, 
  MapPin, 
  Video, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { updateAppointment } from '../../api/appointmentApi';
import toast from 'react-hot-toast';

const SmartCalendar = ({ appointments = [], onDateSelect, loading, onAppointmentUpdate }) => {
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [title, setTitle] = useState('');
  
  // Tooltip state
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Sync date formatting language with document direction
  const isRtl = document.documentElement.dir === 'rtl';
  const locale = isRtl ? 'ar' : 'en';

  // Format events for FullCalendar
  const events = appointments.map(apt => {
    try {
      const dateStr = format(new Date(apt.date), 'yyyy-MM-dd');
      const startStr = `${dateStr}T${apt.startTime}`;
      const endStr = `${dateStr}T${apt.endTime}`;

      return {
        id: apt._id,
        title: apt.patientDetails?.name || apt.patient?.name || 'مريض غير معروف',
        start: startStr,
        end: endStr,
        allDay: false,
        extendedProps: {
          appointment: apt,
        },
      };
    } catch (err) {
      console.error('Error formatting event:', err, apt);
      return null;
    }
  }).filter(Boolean);

  // Handle Event Drag & Drop
  const handleEventDrop = async (info) => {
    const { event } = info;
    const apt = event.extendedProps.appointment;
    
    const newStart = event.start;
    const newEnd = event.end || new Date(newStart.getTime() + 30 * 60 * 1000); // fallback 30m
    
    const newDateStr = format(newStart, 'yyyy-MM-dd');
    const newStartTimeStr = format(newStart, 'HH:mm');
    const newEndTimeStr = format(newEnd, 'HH:mm');

    try {
      await updateAppointment(apt._id, {
        date: newDateStr,
        startTime: newStartTimeStr,
        endTime: newEndTimeStr,
      });
      
      toast.success(isRtl ? 'تمت إعادة جدولة الموعد بنجاح' : 'Appointment rescheduled successfully');
      
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }
    } catch (err) {
      info.revert();
      console.error(err);
      toast.error(isRtl ? 'فشل في إعادة جدولة الموعد' : 'Failed to reschedule appointment');
    }
  };

  // Handle Event Resizing
  const handleEventResize = async (info) => {
    const { event } = info;
    const apt = event.extendedProps.appointment;
    
    const newStart = event.start;
    const newEnd = event.end;
    
    if (!newEnd) return;

    const newStartTimeStr = format(newStart, 'HH:mm');
    const newEndTimeStr = format(newEnd, 'HH:mm');

    try {
      await updateAppointment(apt._id, {
        startTime: newStartTimeStr,
        endTime: newEndTimeStr,
      });
      
      toast.success(isRtl ? 'تم تعديل مدة الموعد بنجاح' : 'Appointment duration updated successfully');
      
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }
    } catch (err) {
      info.revert();
      console.error(err);
      toast.error(isRtl ? 'فشل في تعديل مدة الموعد' : 'Failed to update duration');
    }
  };

  // Handle Date Click
  const handleDateClick = (info) => {
    if (onDateSelect) {
      onDateSelect(new Date(info.dateStr));
    }
  };

  // Handle Event Click (Focuses today schedule on this date)
  const handleEventClick = (info) => {
    const eventDate = info.event.start;
    if (onDateSelect && eventDate) {
      onDateSelect(eventDate);
    }
  };

  // Custom toolbar navigation
  const handlePrev = () => {
    const api = calendarRef.current.getApi();
    api.prev();
    setTitle(api.view.title);
    if (onDateSelect) onDateSelect(api.getDate());
  };

  const handleNext = () => {
    const api = calendarRef.current.getApi();
    api.next();
    setTitle(api.view.title);
    if (onDateSelect) onDateSelect(api.getDate());
  };

  const handleToday = () => {
    const api = calendarRef.current.getApi();
    api.today();
    setTitle(api.view.title);
    if (onDateSelect) onDateSelect(new Date());
  };

  const changeView = (viewName) => {
    const api = calendarRef.current.getApi();
    api.changeView(viewName);
    setCurrentView(viewName);
    setTitle(api.view.title);
  };

  useEffect(() => {
    if (calendarRef.current) {
      setTitle(calendarRef.current.getApi().view.title);
    }
  }, [loading]);

  // Tooltip handler
  const handleMouseEnter = (info) => {
    const rect = info.el.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    setHoveredEvent(info.event.extendedProps.appointment);
  };

  const handleMouseLeave = () => {
    setHoveredEvent(null);
  };

  // Render event card inside cells
  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const apt = event.extendedProps.appointment;
    const status = apt?.status || 'pending';
    
    let statusClass = 'border-amber-200 bg-amber-50 text-amber-700';
    let statusDot = 'bg-amber-500';

    if (status === 'confirmed') {
      statusClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';
      statusDot = 'bg-emerald-500';
    } else if (status === 'completed') {
      statusClass = 'border-blue-200 bg-blue-50 text-blue-700';
      statusDot = 'bg-blue-500';
    } else if (status === 'cancelled') {
      statusClass = 'border-rose-200 bg-rose-50 text-rose-700';
      statusDot = 'bg-rose-500';
    }

    const name = event.title;
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

    return (
      <div className={`flex items-center gap-2 p-1.5 rounded-xl border w-full text-xs shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] ${statusClass}`}>
        <div className="w-5 h-5 rounded-lg bg-white/70 flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm border border-black/5">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{name}</div>
          <div className="text-[9px] opacity-75 flex items-center gap-1 mt-0.5">
            <Clock size={8} /> {apt?.startTime}
          </div>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${statusDot} shrink-0`}></div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
      {/* Custom Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-inner">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 capitalize">
              {title || '...'}
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {isRtl ? 'إدارة المواعيد والجدولة الزمنية' : 'Manage schedules and appointments'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month/Week/Day Views Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
            {[
              { id: 'dayGridMonth', label: isRtl ? 'شهر' : 'Month' },
              { id: 'timeGridWeek', label: isRtl ? 'أسبوع' : 'Week' },
              { id: 'timeGridDay', label: isRtl ? 'يوم' : 'Day' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => changeView(v.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                  currentView === v.id 
                    ? 'bg-white text-blue-600 shadow-sm border border-black/5' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200/30">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100"
            >
              {isRtl ? <ChevronRight size={18} className="text-slate-600" /> : <ChevronLeft size={18} className="text-slate-600" />}
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-all border border-slate-200 shadow-sm"
            >
              {isRtl ? 'اليوم' : 'Today'}
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100"
            >
              {isRtl ? <ChevronLeft size={18} className="text-slate-600" /> : <ChevronRight size={18} className="text-slate-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="p-5 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex items-center justify-center transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-bold text-slate-500">{isRtl ? 'جاري تحميل المواعيد...' : 'Loading appointments...'}</span>
            </div>
          </div>
        )}

        <div className="fc-premium-theme">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={false} // Hidden standard header
            events={events}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            locale={locale}
            direction={isRtl ? 'rtl' : 'ltr'}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventMouseEnter={handleMouseEnter}
            eventMouseLeave={handleMouseLeave}
            eventContent={renderEventContent}
            slotDuration="00:30:00"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short',
              hour12: true
            }}
            allDaySlot={false}
            height="auto"
          />
        </div>
      </div>

      {/* Floating Interactive Tooltip */}
      <AnimatePresence>
        {hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'absolute',
              left: tooltipPos.x - 140, // centered (width is 280)
              top: tooltipPos.y - 200,
              zIndex: 9999,
              pointerEvents: 'none'
            }}
            className="w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl p-4 text-xs select-none"
          >
            {/* Header / Avatar */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-200">
                {hoveredEvent.patientDetails?.name?.charAt(0) || hoveredEvent.patient?.name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-slate-800 truncate">
                  {hoveredEvent.patientDetails?.name || hoveredEvent.patient?.name || 'مريض غير معروف'}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 font-semibold">
                  {hoveredEvent.bookingType === 'virtual' ? (
                    <>
                      <Video size={10} className="text-indigo-500" />
                      <span>{isRtl ? 'استشارة مرئية' : 'Virtual Consult'}</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={10} className="text-emerald-500" />
                      <span>{isRtl ? 'زيارة للعيادة' : 'Clinic Visit'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Middle details */}
            <div className="py-3 space-y-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Clock size={12} className="text-slate-400" />
                <span>
                  {format(new Date(hoveredEvent.date), 'EEEE, d MMMM')} @ {hoveredEvent.startTime} - {hoveredEvent.endTime}
                </span>
              </div>
              
              {(hoveredEvent.patientDetails?.phone || hoveredEvent.patient?.phone) && (
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Phone size={12} className="text-slate-400" />
                  <span>{hoveredEvent.patientDetails?.phone || hoveredEvent.patient?.phone}</span>
                </div>
              )}

              {hoveredEvent.reason && (
                <div className="mt-1 p-2 bg-slate-50 rounded-lg text-slate-500 border border-slate-100/50 font-medium">
                  <span className="font-bold block text-[10px] text-slate-400 uppercase mb-0.5">{isRtl ? 'سبب الزيارة' : 'Reason'}</span>
                  {hoveredEvent.reason}
                </div>
              )}
            </div>

            {/* Footer with Status */}
            <div className="flex justify-between items-center pt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{isRtl ? 'حالة الحجز' : 'Status'}</span>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${
                hoveredEvent.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                hoveredEvent.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                hoveredEvent.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {hoveredEvent.status}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled calendar overrides injected via CSS */}
      <style>{`
        .fc {
          font-family: 'Cairo', sans-serif !important;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #f1f5f9 !important;
        }
        .fc-col-header-cell {
          background-color: #f8fafc;
          padding: 10px 0 !important;
        }
        .fc-col-header-cell-cushion {
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase;
          color: #94a3b8 !important;
          letter-spacing: 0.05em;
        }
        .fc-daygrid-day {
          transition: background-color 0.2s ease;
        }
        .fc-daygrid-day:hover {
          background-color: #f8fafc/50 !important;
        }
        .fc-day-today {
          background-color: #eff6ff/40 !important;
          position: relative;
        }
        .fc-day-today .fc-daygrid-day-number {
          background-color: #3b82f6 !important;
          color: white !important;
          border-radius: 8px;
          min-width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 4px;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4);
        }
        .fc-daygrid-day-number {
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #64748b;
          text-decoration: none !important;
          margin: 4px;
        }
        .fc-event {
          border: none !important;
          background: transparent !important;
          margin: 2px 4px !important;
        }
        .fc-daygrid-more-link {
          font-size: 10px !important;
          font-weight: 800 !important;
          color: #3b82f6 !important;
          text-decoration: none !important;
          margin-left: 6px;
        }
        .fc-timegrid-slot {
          height: 48px !important;
        }
        .fc-timegrid-slot-label-cushion {
          font-size: 10px !important;
          font-weight: 700 !important;
          color: #64748b !important;
        }
        .fc-daygrid-day-frame {
          min-height: 110px !important;
        }
      `}</style>
    </div>
  );
};

export default SmartCalendar;
