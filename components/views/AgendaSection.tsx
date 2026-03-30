import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Lock, Calendar, Check, Users } from 'lucide-react';
import { db } from '../../services/firebase';
import { recalculateGamification } from '../../services/gamification';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, Timestamp, collectionGroup, getDoc, setDoc } from 'firebase/firestore';

interface Session {
  id: string;
  date: string;
  time: string;
  createdAt?: any;
}

// Helper to get the start of the week (Monday)
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const AgendaSection = ({ user }: { user: any }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal] = useState<{
      type: string;
      sessionTime: string;
      sessionDay: number | null,
      message?: string,
      sessionToReplace?: Session,
      clientName?: string,
      isRecurring?: boolean,
      existingSessionId?: string
  }>({ type: 'none', sessionTime: '', sessionDay: null });

  const [bookedSessions, setBookedSessions] = useState<(Session & { clientName?: string })[]>([]);
  const [takenSlots, setTakenSlots] = useState<{[key: string]: boolean}>({});

  const isTrainer = user?.isTrainer;
  const userPlan = user?.plan;

  useEffect(() => {
    const q = query(collection(db, 'bookedSlots'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taken: {[key: string]: boolean} = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        taken[`${data.date}_${data.time}`] = true;
      });
      setTakenSlots(taken);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    if (isTrainer) {
        const q = collectionGroup(db, 'events');
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const allSessions: any[] = [];
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const parentPath = docSnap.ref.parent.path;
                const match = parentPath.match(/agenda\/([^/]+)\/events/);
                const uid = match ? match[1] : '';

                let clientName = 'Atleta';
                if (uid) {
                   try {
                     const userSnap = await getDoc(doc(db, 'users', uid));
                     if (userSnap.exists()) {
                        const userData = userSnap.data();
                        clientName = userData.displayName || 'Atleta';
                     }
                   } catch(e) {}
                }

                allSessions.push({ id: docSnap.id, clientName, ...data });
            }
            setBookedSessions(allSessions);
        });
        return () => unsubscribe();
    } else {
      const q = query(collection(db, `agenda/${user.id}/events`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setBookedSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      });
      return () => unsubscribe();
    }
  }, [user?.id, isTrainer]);

  const isEligibleForEvaluation = !isTrainer && (!userPlan || userPlan === 'Sin Plan' || userPlan === 'free') && bookedSessions.length === 0;
  const hasPlan = isTrainer || (!!userPlan && userPlan !== 'Sin Plan' && userPlan !== 'free');
  const canBook = hasPlan || isEligibleForEvaluation;

  const getGoogleCalendarUrl = (sessionDate: Date, sessionTime: string, isRecurring: boolean = false) => {
    const [hour, minute] = sessionTime.split(':');
    const startDateTime = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate(), parseInt(hour), parseInt(minute));
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1);
    const formatDateTime = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent("Sesión de Entrenamiento Tommybox");
    const description = encodeURIComponent(`Sesión de entrenamiento personal agendada.`);

    let url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateTime(startDateTime)}/${formatDateTime(endDateTime)}&details=${description}`;

    if (isRecurring) {
        url += `&recur=RRULE:FREQ=WEEKLY`;
    }

    return url;
  };

  const getIcsUrl = (sessionDate: Date, sessionTime: string, isRecurring: boolean = false) => {
    const [hour, minute] = sessionTime.split(':');
    const startDateTime = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate(), parseInt(hour), parseInt(minute));
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1);
    const formatDateIcs = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Tommybox//NONSGML v1.0//ES\nBEGIN:VEVENT\nUID:${new Date().getTime()}@tomybox.com\nDTSTAMP:${formatDateIcs(new Date())}\nDTSTART:${formatDateIcs(startDateTime)}\nDTEND:${formatDateIcs(endDateTime)}\nSUMMARY:Sesión de Entrenamiento Tommybox\nDESCRIPTION:Sesión de entrenamiento personal agendada.`;

    if (isRecurring) {
        icsContent += `\nRRULE:FREQ=WEEKLY`;
    }

    icsContent += `\nEND:VEVENT\nEND:VCALENDAR`;
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  };

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const changeWeek = (direction: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction * 7));
      setCurrentDate(newDate);
  };

  const startOfWeek = getStartOfWeek(currentDate);

  const handleSlotClick = (dayIndex: number, time: string) => {
      const slotDate = new Date(startOfWeek);
      slotDate.setDate(slotDate.getDate() + dayIndex);
      const dateStr = slotDate.toISOString().split('T')[0];

      if (slotDate < new Date() && slotDate.getDate() !== new Date().getDate()) return;

      const existingSession = bookedSessions.find(s => s.date === dateStr && s.time === time);

      if (isTrainer) {
           if (existingSession) {
               alert(`Sesión agendada con: ${existingSession.clientName}`);
           }
           return;
      }

      if (existingSession) {
           setModal({
               type: 'cancel',
               sessionTime: time,
               sessionDay: dayIndex,
               existingSessionId: existingSession.id
           });
           return;
      }

      if (!canBook) {
           setModal({
               type: 'no-plan',
               sessionTime: time,
               sessionDay: dayIndex,
               message: "Necesitas un plan activo para agendar sesiones."
           });
           return;
      }

      setModal({
          type: 'confirm',
          sessionTime: time,
          sessionDay: dayIndex,
          isRecurring: false
      });
  };

  const confirmBooking = async () => {
    if (user?.id && modal.sessionDay !== null) {
      const slotDate = new Date(startOfWeek);
      slotDate.setDate(slotDate.getDate() + modal.sessionDay);
      const dateStr = slotDate.toISOString().split('T')[0];
      const slotId = `${dateStr}_${modal.sessionTime.replace(':', '-')}`;

      try {
        await addDoc(collection(db, `agenda/${user.id}/events`), {
          date: dateStr,
          time: modal.sessionTime,
          createdAt: Timestamp.now()
        });

        await setDoc(doc(db, 'bookedSlots', slotId), {
          date: dateStr,
          time: modal.sessionTime,
          bookedBy: user.id,
          createdAt: Timestamp.now()
        });

        recalculateGamification(user.id).catch(console.error);
        setModal({ ...modal, type: 'success' });
      } catch(e) {
        console.error(e);
      }
    }
  };

  const cancelBooking = async () => {
    if (user?.id && modal.existingSessionId && modal.sessionDay !== null) {
      const slotDate = new Date(startOfWeek);
      slotDate.setDate(slotDate.getDate() + modal.sessionDay);
      const dateStr = slotDate.toISOString().split('T')[0];
      const slotId = `${dateStr}_${modal.sessionTime.replace(':', '-')}`;

      try {
        await deleteDoc(doc(db, `agenda/${user.id}/events`, modal.existingSessionId));
        await deleteDoc(doc(db, 'bookedSlots', slotId));
        setModal({ ...modal, type: 'none' });
      } catch(e) {
        console.error(e);
      }
    }
  }

  const renderCell = (dayIndex: number, time: string) => {
      const slotDate = new Date(startOfWeek);
      slotDate.setDate(slotDate.getDate() + dayIndex);
      const dateStr = slotDate.toISOString().split('T')[0];

      const isPast = slotDate < new Date() && slotDate.getDate() !== new Date().getDate();

      const myBooking = !isTrainer && bookedSessions.find(s => s.date === dateStr && s.time === time);
      const trainerBooking = isTrainer && bookedSessions.find(s => s.date === dateStr && s.time === time);

      const slotKey = `${dateStr}_${time}`;
      const isTakenByOther = !isTrainer && !myBooking && takenSlots[slotKey];

      let cellClass = "border border-gray-100 p-2 h-14 sm:h-20 transition-all cursor-pointer relative flex flex-col items-center justify-center ";

      if (isPast) {
          cellClass += 'bg-gray-100 text-gray-300 cursor-not-allowed';
      } else if (myBooking) {
          cellClass += 'bg-blue-100 border-blue-300 hover:bg-blue-200';
      } else if (isTakenByOther) {
          cellClass += 'bg-red-50 border-red-200 cursor-not-allowed';
      } else if (trainerBooking) {
          cellClass += 'bg-purple-100 border-purple-200 hover:bg-purple-200';
      } else {
          cellClass += 'hover:bg-gray-50 bg-white';
      }

      return (
          <div
              key={`${dayIndex}-${time}`}
              className={cellClass}
              onClick={() => !isPast && !isTakenByOther && handleSlotClick(dayIndex, time)}
          >
              {myBooking && (
                  <div className="flex flex-col items-center animate-scale-up">
                      <span className="text-xl">🥊</span>
                      <span className="text-[10px] font-bold text-blue-700 hidden sm:inline">Mi Sesión</span>
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
                      <Users className="text-purple-600 mb-1" size={16} />
                      <span className="text-[9px] sm:text-[10px] font-bold text-purple-700 truncate w-full text-center">
                          {trainerBooking.clientName}
                      </span>
                  </div>
              )}
              {!myBooking && !trainerBooking && !isTakenByOther && !isPast && (
                  <div className="opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <section className="container mx-auto max-w-5xl">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <div className="mb-4 md:mb-0">
               <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                   <Calendar className="text-blue-600" /> Agenda Semanal
               </h2>
               <p className="text-gray-500 text-sm">
                   {isTrainer ? 'Gestiona las sesiones de todos los atletas' : 'Reserva tus horas de entrenamiento'}
               </p>
           </div>

           <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl">
               <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-gray-600">
                   <ChevronLeft size={20} />
               </button>
               <span className="text-sm font-bold w-32 text-center">
                   {startOfWeek.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - {(() => {
                       const end = new Date(startOfWeek);
                       end.setDate(end.getDate() + 5);
                       return end.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                   })()}
               </span>
               <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-gray-600">
                   <ChevronRight size={20} />
               </button>
           </div>
       </div>

       {/* Grid */}
       <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
           {/* Days Header */}
           <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
               <div className="p-2 sm:p-4 text-center border-r border-gray-100 flex items-center justify-center">
                   <span className="text-xs font-bold text-gray-400">HORA</span>
               </div>
               {days.map((day, index) => {
                   const date = new Date(startOfWeek);
                   date.setDate(date.getDate() + index);
                   const isToday = new Date().toDateString() === date.toDateString();

                   return (
                       <div key={day} className={`p-2 sm:p-4 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                           <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{day}</p>
                           <p className={`text-sm sm:text-lg font-black ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                               {date.getDate()}
                           </p>
                       </div>
                   );
               })}
           </div>

           {/* Time Slots */}
           <div className="divide-y divide-gray-100">
               {times.map(time => (
                   <div key={time} className="grid grid-cols-7">
                       <div className="p-2 sm:p-4 text-center border-r border-gray-100 flex items-center justify-center bg-gray-50/50">
                           <span className="text-xs font-bold text-gray-500">{time}</span>
                       </div>
                       {days.map((_, dayIndex) => renderCell(dayIndex, time))}
                   </div>
               ))}
           </div>
       </div>

       {/* Modals */}
       {modal.type !== 'none' && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
               <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
                   <button
                        onClick={() => setModal({ ...modal, type: 'none' })}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                   >
                       <X size={20} />
                   </button>

                   {modal.type === 'no-plan' && (
                       <div className="text-center">
                           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                               <Lock size={32} />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h3>
                           <p className="text-gray-500 mb-6">{modal.message}</p>
                           <button
                               onClick={() => { setModal({ ...modal, type: 'none' }); }}
                               className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                           >
                               Cerrar
                           </button>
                       </div>
                   )}

                   {modal.type === 'cancel' && (
                       <div className="text-center">
                           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                               <X size={32} />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900 mb-2">Cancelar Reserva</h3>
                           <p className="text-gray-500 mb-6">
                               ¿Estás seguro de cancelar tu sesión para el <br/>
                               <span className="font-bold text-gray-900">
                                   {days[modal.sessionDay!]} a las {modal.sessionTime}
                               </span>?
                           </p>

                           <div className="flex gap-3">
                               <button
                                   onClick={() => setModal({ ...modal, type: 'none' })}
                                   className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                               >
                                   Volver
                               </button>
                               <button
                                   onClick={cancelBooking}
                                   className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
                               >
                                   Cancelar Sesión
                               </button>
                           </div>
                       </div>
                   )}

                   {modal.type === 'confirm' && (
                       <div className="text-center">
                           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                               <Calendar size={32} />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Reserva</h3>
                           <p className="text-gray-500 mb-6">
                               ¿Agendar sesión para el <br/>
                               <span className="font-bold text-gray-900">
                                   {days[modal.sessionDay!]} a las {modal.sessionTime}
                               </span>?
                           </p>

                           <div className="flex gap-3">
                               <button
                                   onClick={() => setModal({ ...modal, type: 'none' })}
                                   className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                               >
                                   Cancelar
                               </button>
                               <button
                                   onClick={confirmBooking}
                                   className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                               >
                                   Confirmar
                               </button>
                           </div>
                       </div>
                   )}

                   {modal.type === 'success' && (
                       <div className="text-center">
                           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 animate-scale-up">
                               <Check size={32} strokeWidth={4} />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900 mb-2">¡Reserva Exitosa!</h3>
                           <p className="text-gray-500 mb-6">Tu sesión ha sido agendada correctamente.</p>

                           <div className="space-y-3">
                               <a
                                   href={getGoogleCalendarUrl(
                                       (() => {
                                           const d = new Date(startOfWeek);
                                           d.setDate(d.getDate() + (modal.sessionDay || 0));
                                           return d;
                                       })(),
                                       modal.sessionTime,
                                       modal.isRecurring
                                   )}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="block w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
                               >
                                   <Calendar size={18} /> Agregar a Google Calendar
                               </a>
                               <a
                                    href={getIcsUrl(
                                        (() => {
                                           const d = new Date(startOfWeek);
                                           d.setDate(d.getDate() + (modal.sessionDay || 0));
                                           return d;
                                       })(),
                                       modal.sessionTime,
                                       modal.isRecurring
                                    )}
                                    download="entrenamiento_tommybox.ics"
                                    className="block w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
                               >
                                    <Calendar size={18} /> Descargar .ICS
                               </a>
                               <button
                                   onClick={() => setModal({ ...modal, type: 'none' })}
                                   className="block w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black mt-4"
                               >
                                   Cerrar
                               </button>
                           </div>
                       </div>
                   )}
               </div>
           </div>
       )}
    </section>
  );
};

export default AgendaSection;
