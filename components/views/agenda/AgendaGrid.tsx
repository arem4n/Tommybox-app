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
    const isPast = slotDate < new Date() && slotDate.getDate() !== new Date().getDate();

    const myBooking = !isTrainer && bookedSessions.find((s) => s.date === dateStr && s.time === time);
    const trainerBooking = isTrainer && bookedSessions.find((s) => s.date === dateStr && s.time === time);
    const slotKey = `${dateStr}_${time}`;
    const isTakenByOther = !isTrainer && !myBooking && takenSlots[slotKey];

    // Session type styling
    const sType = (myBooking || trainerBooking)
      ? ((myBooking || trainerBooking) as BookedSession).sessionType as SessionType | undefined
      : undefined;
    const typeStyle = sType ? SESSION_TYPE_CONFIG[sType] : null;

    let cellClass = 'border border-gray-100 p-1 h-14 sm:h-20 transition-all cursor-pointer relative flex flex-col items-center justify-center ';
    if (isPast) cellClass += 'bg-gray-100 text-gray-300 cursor-not-allowed';
    else if (myBooking) cellClass += typeStyle ? `${typeStyle.bg} ${typeStyle.border} hover:opacity-90` : 'bg-blue-100 border-blue-300 hover:bg-blue-200';
    else if (isTakenByOther) cellClass += 'bg-red-50 border-red-200 cursor-not-allowed';
    else if (trainerBooking) cellClass += typeStyle ? `${typeStyle.bg} ${typeStyle.border} hover:opacity-90` : 'bg-purple-100 border-purple-200 hover:bg-purple-200';
    else cellClass += 'hover:bg-gray-50 bg-white';

    return (
      <div
        key={`${dayIndex}-${time}`}
        className={cellClass}
        onClick={() => !isPast && !isTakenByOther && onSlotClick(dayIndex, time)}
      >
        {myBooking && (
          <div className="flex flex-col items-center animate-scale-up">
            <span className="text-lg sm:text-xl">🥊</span>
            {sType && (
              <span className={`text-[8px] font-black hidden sm:inline px-1 py-0.5 rounded mt-0.5 ${typeStyle?.text}`}>
                {sType}
              </span>
            )}
          </div>
        )}
        {isTakenByOther && (
          <div className="flex flex-col items-center">
            <span className="text-red-400 text-xs font-bold">●</span>
            <span className="text-[9px] font-bold text-red-400 hidden sm:inline">Ocupado</span>
          </div>
        )}
        {trainerBooking && (
          <div className="flex flex-col items-center animate-scale-up w-full overflow-hidden px-1">
            <Users className={typeStyle ? typeStyle.text : 'text-purple-600'} size={14} />
            <span className={`text-[8px] sm:text-[9px] font-bold truncate w-full text-center mt-0.5 ${typeStyle?.text ?? 'text-purple-700'}`}>
              {(trainerBooking as BookedSession).clientName}
            </span>
            {sType && (
              <span className={`text-[7px] font-black hidden sm:inline ${typeStyle?.text}`}>{sType}</span>
            )}
          </div>
        )}
        {!myBooking && !trainerBooking && !isTakenByOther && !isPast && (
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
