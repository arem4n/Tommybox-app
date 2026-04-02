import React, { useState, useEffect } from 'react';
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
}

const AttendanceView = ({ user }: { user: any }) => {
  const [sessions, setSessions] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('pending');

  const todayStr = new Date().toISOString().split('T')[0];
  const userCache = new Map<string, { name: string; email: string }>();

  useEffect(() => {
    const q = collectionGroup(db, 'events');
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const pastSessions: SessionEvent[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.date >= todayStr) continue; // solo pasadas

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

        pastSessions.push({
          id: docSnap.id,
          date: data.date,
          time: data.time,
          attended: data.attended ?? false,
          userId: uid,
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          docPath: docSnap.ref.path,
        });
      }

      // Sort: most recent first
      pastSessions.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
      setSessions(pastSessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleAttendance = async (session: SessionEvent) => {
    try {
      const eventRef = doc(db, session.docPath);
      const newAttended = !session.attended;
      await updateDoc(eventRef, { attended: newAttended });
      if (newAttended) {
        recalculateGamification(session.userId).catch(console.error);
      }
    } catch (e) {
      console.error('Error updating attendance:', e);
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
    if (filter === 'pending') return !s.attended;
    if (filter === 'confirmed') return s.attended;
    return true;
  });

  // Group by client
  const grouped = filtered.reduce<Record<string, SessionEvent[]>>((acc, s) => {
    if (!acc[s.clientName]) acc[s.clientName] = [];
    acc[s.clientName].push(s);
    return acc;
  }, {});

  const totalPending = sessions.filter(s => !s.attended).length;
  const totalConfirmed = sessions.filter(s => s.attended).length;

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
                      <div
                        key={session.id}
                        className={`flex items-center justify-between px-5 py-4 transition-colors ${
                          session.attended ? 'bg-green-50/40' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {session.attended ? (
                            <CheckCircle size={20} className="text-green-500 shrink-0" />
                          ) : (
                            <Clock size={20} className="text-amber-400 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-800 text-sm capitalize">
                              {formatDate(session.date)}
                            </p>
                            <p className="text-xs text-gray-400">{session.time} hs</p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleAttendance(session)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            session.attended
                              ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-600 hover:text-white'
                          }`}
                        >
                          {session.attended ? '✓ Asistió' : 'Confirmar'}
                        </button>
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
