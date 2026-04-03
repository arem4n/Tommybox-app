import React from 'react';
import { Users } from 'lucide-react';
import { BookedSession, TakenSlots } from '../../../hooks/useAgenda';
import { SESSION_TYPE_CONFIG, SessionType } from '../../../types';

export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

interface AgendaGridProps {
  startOfWeek: Date;
  bookedSessions: BookedSession[];
  takenSlots: TakenSlots;
  isTrainer: boolean;
  onSlotClick: (dayIndex: number, time: string) => void;
}

/** Renders the weekly grid with time slots and booking state indicators. */
const AgendaGrid: React.FC<AgendaGridProps> = ({
  startOfWeek, bookedSessions, takenSlots, isTrainer, onSlotClick,
}) => {
  const renderCell = (dayIndex: number, time: string) => {
    const slotDate = new Date(startOfWeek);
    slotDate.setDate(slotDate.getDate() + dayIndex);
    const dateStr = slotDate.toISOString().split('T')[0];

    // ── Time-aware slot state ──────────────────────────────────────────────────
    const now = new Date();
    const [slotHour, slotMin] = time.split(':').map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(slotHour, slotMin, 0, 0);

    const isPastSession  = slotDateTime < now;                                          // already happened
    const isTooLate      = !isPastSession && slotDateTime <= new Date(now.getTime() + 60 * 60 * 1000); // < 1h away
    const isLockedForBooking = isPastSession || isTooLate;                              // can't book

    const myBooking      = !isTrainer && bookedSessions.find((s) => s.date === dateStr && s.time === time);
    const trainerBooking =  isTrainer && bookedSessions.find((s) => s.date === dateStr && s.time === time);
    const slotKey        = `${dateStr}_${time}`;
    const isTakenByOther = !isTrainer && !myBooking && takenSlots[slotKey];

    // ── Session type styling ───────────────────────────────────────────────────
    const sType     = (myBooking || trainerBooking)
      ? ((myBooking || trainerBooking) as BookedSession).sessionType as SessionType | undefined
      : undefined;
    const typeStyle = sType ? SESSION_TYPE_CONFIG[sType] : null;

    // ── Cell class ────────────────────────────────────────────────────────────
    let cellClass = 'border border-gray-100 p-1 h-14 sm:h-20 transition-all relative flex flex-col items-center justify-center ';
    if (isPastSession)           cellClass += 'bg-gray-100 text-gray-300 cursor-not-allowed';
    else if (isTooLate)          cellClass += 'bg-amber-50 border-amber-100 cursor-not-allowed';
    else if (myBooking)          cellClass += typeStyle ? `${typeStyle.bg} ${typeStyle.border} hover:opacity-90 cursor-pointer` : 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-pointer';
    else if (isTakenByOther)     cellClass += 'bg-red-50 border-red-200 cursor-not-allowed';
    else if (trainerBooking)     cellClass += typeStyle ? `${typeStyle.bg} ${typeStyle.border} hover:opacity-90 cursor-pointer` : 'bg-purple-100 border-purple-200 hover:bg-purple-200 cursor-pointer';
    else                         cellClass += 'hover:bg-gray-50 bg-white cursor-pointer';

    // ── Past session: empty gray cell, no indicators ────────────────────────────────
    // Sessions that already started are shown as clean empty cells so the grid
    // focuses attention only on upcoming bookings.
    if (isPastSession) {
      return (
        <div
          key={`${dayIndex}-${time}`}
          className="border border-gray-100 h-14 sm:h-20 bg-gray-50"
        />
      );
    }

    return (
      <div
        key={`${dayIndex}-${time}`}
        className={cellClass}
        onClick={() => !isLockedForBooking && !isTakenByOther && onSlotClick(dayIndex, time)}
      >
        {myBooking && myBooking.status !== 'rejected' && (
          <div className={`flex flex-col items-center animate-scale-up ${myBooking.status === 'pending' ? 'opacity-70' : ''}`}>
            <span className="text-lg sm:text-xl">🥊</span>
            <span className={`text-[8px] font-black px-1 py-0.5 rounded mt-0.5 ${myBooking.status === 'pending' ? 'bg-amber-100 text-amber-700' : (typeStyle?.text || 'text-blue-700')}`}>
              {myBooking.status === 'pending' ? 'PENDIENTE' : (sType || 'Sesión')}
            </span>
          </div>
        )}
        {isTakenByOther && (
          <div className="flex flex-col items-center">
            <span className="text-red-400 text-xs font-bold">●</span>
            <span className="text-[9px] font-bold text-red-400 hidden sm:inline">Ocupado</span>
          </div>
        )}
        {trainerBooking && trainerBooking.status !== 'rejected' && (
          <div className={`flex flex-col items-center animate-scale-up w-full overflow-hidden px-1 ${trainerBooking.status === 'pending' ? 'opacity-80' : ''}`}>
            <Users className={trainerBooking.status === 'pending' ? 'text-amber-500' : (typeStyle ? typeStyle.text : 'text-purple-600')} size={14} />
            <span className={`text-[8px] sm:text-[9px] font-bold truncate w-full text-center mt-0.5 ${trainerBooking.status === 'pending' ? 'text-amber-700' : (typeStyle?.text ?? 'text-purple-700')}`}>
              {trainerBooking.status === 'pending' ? '📋 PENDIENTE' : (trainerBooking as BookedSession).clientName}
            </span>
            {sType && trainerBooking.status !== 'pending' && (
              <span className={`text-[7px] font-black hidden sm:inline ${typeStyle?.text}`}>{sType}</span>
            )}
          </div>
        )}
        {/* 'Too late' indicator — only on free available slots */}
        {isTooLate && !myBooking && !trainerBooking && !isTakenByOther && (
          <span className="text-[9px] font-bold text-amber-400 hidden sm:inline text-center leading-tight">
            Cierra<br/>en breve
          </span>
        )}
        {/* Available dot */}
        {!myBooking && !trainerBooking && !isTakenByOther && !isLockedForBooking && (
          <div className="opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        <div className="p-2 sm:p-4 text-center border-r border-gray-100 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-400">HORA</span>
        </div>
        {DAYS.map((day, index) => {
          const date = new Date(startOfWeek);
          date.setDate(date.getDate() + index);
          const isToday = new Date().toDateString() === date.toDateString();
          return (
            <div key={day} className={`p-2 sm:p-4 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
              <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{day}</p>
              <p className={`text-sm sm:text-lg font-black ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>{date.getDate()}</p>
            </div>
          );
        })}
      </div>

      {/* Time Slots */}
      <div className="divide-y divide-gray-100">
        {TIMES.map((time) => (
          <div key={time} className="grid grid-cols-7">
            <div className="p-2 sm:p-4 text-center border-r border-gray-100 flex items-center justify-center bg-gray-50/50">
              <span className="text-xs font-bold text-gray-500">{time}</span>
            </div>
            {DAYS.map((_, dayIndex) => renderCell(dayIndex, time))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap gap-3">
        {(Object.keys(SESSION_TYPE_CONFIG) as SessionType[]).map((t) => {
          const cfg = SESSION_TYPE_CONFIG[t];
          return (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs text-gray-500 font-medium">{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaGrid;
