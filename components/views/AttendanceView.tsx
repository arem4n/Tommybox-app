import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collectionGroup, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { recalculateGamification } from '../../services/gamification';

interface SessionEvent {
  id: string;
  date: string;
  time: string;
  attended?: boolean;
  userId: string;
  clientName: string;
  clientEmail: string;
  docPath: string;
  status?: 'pending' | 'confirmed' | 'rejected';
  rejectionReason?: string;
}

const AttendanceView = ({ user }: { user: any }) => {
  const [rawSessions, setRawSessions] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Reactive clock — updates every minute so sessions auto-appear when their time passes
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Sessions visible to the trainer: date/time has already passed ──────────────
  // useMemo re-runs every minute (depends on `now`) so the list updates in real-time
  const sessions = useMemo(() => {
    const nowDateStr = now.toISOString().split('T')[0];
    const nowTimeStr = now.toTimeString().slice(0, 5); // HH:MM
    return rawSessions.filter(s => {
      if (s.date > nowDateStr) return false;                         // future date
      if (s.date === nowDateStr && s.time > nowTimeStr) return false; // today, time not reached
      return true;
    });
  }, [rawSessions, now]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoffStr = sixMonthsAgo.toISOString().split('T')[0];

  const userCache = new Map<string, { name: string; email: string }>();

  useEffect(() => {
    const q = collectionGroup(db, 'events');
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allPast: SessionEvent[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.date < cutoffStr) continue;    // ignorar más de 6 meses (date filter only; time filter is in useMemo)

        const parentPath = docSnap.ref.parent.path;
        const match = parentPath.match(/agenda\/([^/]+)\/events/);
        const uid = match ? match[1] : '';
        if (!uid) continue;

        let clientInfo = { name: 'Atleta', email: '' };
        if (userCache.has(uid)) {
          clientInfo = userCache.get(uid)!;
        } else {
          try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
              const d = userSnap.data();
              clientInfo = { name: d.displayName || 'Atleta', email: d.email || '' };
              userCache.set(uid, clientInfo);
            }
          } catch {}
        }

        allPast.push({
          id: docSnap.id,
          date: data.date,
          time: data.time,
          attended: data.attended ?? false,
          userId: uid,
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          docPath: docSnap.ref.path,
          status: data.status,
          rejectionReason: data.rejectionReason,
        });
      }

      // Sort: most recent first; useMemo will apply date/time filter
      allPast.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
      setRawSessions(allPast);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleAttendance = async (session: SessionEvent) => {
    try {
      const eventRef = doc(db, session.docPath);
      const newAttended = !session.attended;
      await updateDoc(eventRef, { 
        attended: newAttended,
        status: newAttended ? 'confirmed' : 'pending'
      });
      if (newAttended) {
        recalculateGamification(session.userId).catch(console.error);
      }
    } catch (e) {
      console.error('Error updating attendance:', e);
    }
  };

  const handleReject = async (session: SessionEvent) => {
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      const eventRef = doc(db, session.docPath);
      batch.update(eventRef, {
        status: 'rejected',
        rejectionReason: rejectReason || 'Inasistencia injustificada',
        attended: false,
      });

      const slotId = `${session.date}_${session.time.replace(':', '-')}`;
      batch.delete(doc(db, 'bookedSlots', slotId));

      await batch.commit();

      setRejectingId(null);
      setRejectReason('');
    } catch (e) {
      console.error('Error rejecting session:', e);
    }
  };

  const toggleClient = (clientName: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      next.has(clientName) ? next.delete(clientName) : next.add(clientName);
      return next;
    });
  };

  const filtered = sessions.filter(s => {
    if (filter === 'pending') return !s.attended && s.status !== 'rejected';
    if (filter === 'confirmed') return s.attended && s.status !== 'rejected';
    return true; // 'all' tab shows rejected ones too
  });

  // Group by client
  const grouped = filtered.reduce<Record<string, SessionEvent[]>>((acc, s) => {
    if (!acc[s.clientName]) acc[s.clientName] = [];
    acc[s.clientName].push(s);
    return acc;
  }, {});

  const totalPending = sessions.filter(s => !s.attended && s.status !== 'rejected').length;
  const totalConfirmed = sessions.filter(s => s.attended && s.status !== 'rejected').length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
      weekday: 'short', day: 'numeric', month: 'short'
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-black text-gray-900">{sessions.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Sesiones pasadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-black text-amber-500">{totalPending}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Sin confirmar</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-black text-green-600">{totalConfirmed}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Confirmadas</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {(['pending', 'confirmed', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === f
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'pending' ? 'Pendientes' : f === 'confirmed' ? 'Confirmadas' : 'Todas'}
          </button>
        ))}
      </div>

      {/* Session list grouped by client */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 font-medium">Cargando sesiones...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <CheckCircle className="mx-auto text-green-400 mb-3" size={40} />
          <p className="text-gray-500 font-medium">
            {filter === 'pending' ? 'No hay sesiones pendientes de confirmar 🎉' : 'No hay sesiones en esta vista.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.entries(grouped) as [string, SessionEvent[]][]).map(([clientName, clientSessions]) => {
            const isExpanded = expandedClients.has(clientName);
            const pendingCount = clientSessions.filter(s => !s.attended).length;

            return (
              <div key={clientName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Client header */}
                <button
                  onClick={() => toggleClient(clientName)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">
                      {clientName[0]?.toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{clientName}</p>
                      <p className="text-xs text-gray-500">{clientSessions.length} sesión{clientSessions.length !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {/* Session rows */}
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {clientSessions.map(session => (
                      <div key={session.id} className="flex flex-col border-b border-gray-50 last:border-0">
                        <div
                          className={`flex items-center justify-between px-5 py-4 transition-colors ${
                            session.status === 'rejected' ? 'bg-red-50/40 opacity-70' :
                            session.attended ? 'bg-green-50/40' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {session.status === 'rejected' ? (
                              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <span className="text-red-500 font-bold text-xs">X</span>
                              </div>
                            ) : session.attended ? (
                              <CheckCircle size={20} className="text-green-500 shrink-0" />
                            ) : (
                              <Clock size={20} className="text-amber-400 shrink-0" />
                            )}
                            <div>
                              <p className={`font-semibold text-sm capitalize ${session.status === 'rejected' ? 'text-red-800 line-through' : 'text-gray-800'}`}>
                                {formatDate(session.date)}
                              </p>
                              <p className="text-xs text-gray-400">{session.time} hs {session.status === 'rejected' && '• Rechazada'}</p>
                            </div>
                          </div>

                          {session.status !== 'rejected' && (
                            <div className="flex items-center gap-2">
                              {!session.attended && (
                                <button
                                  onClick={() => {
                                    if (rejectingId === session.id) {
                                      setRejectingId(null);
                                    } else {
                                      setRejectingId(session.id);
                                    }
                                  }}
                                  className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                  Rechazar
                                </button>
                              )}
                              <button
                                onClick={() => toggleAttendance(session)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                  session.attended
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-green-600 hover:text-white'
                                }`}
                              >
                                {session.attended ? '✓ Confirmado' : 'Asistió'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Reject Form */}
                        {rejectingId === session.id && (
                          <div className="px-5 py-4 bg-red-50/50 border-t border-red-100 animate-slide-down">
                            <p className="text-sm font-bold text-red-800 mb-2">Rechazar sesión e informar al atleta:</p>
                            <textarea
                              placeholder="Motivo (ej: Inasistencia injustificada, horario cancelado...)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full rounded-xl border border-red-200 p-3 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none mb-3 bg-white"
                              rows={2}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setRejectingId(null)}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleReject(session)}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700"
                              >
                                Confirmar Rechazo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
