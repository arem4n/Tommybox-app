import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Dumbbell, Zap, Star } from 'lucide-react';

const ClientStatsView = ({ user }: { user: any }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to sessions
    const qSessions = query(collection(db, `agenda/${user.id}/events`));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      setSessions(snapshot.docs.map(doc => doc.data()));
    });

    // Subscribe to metrics
    const qMetrics = query(collection(db, `users/${user.id}/metrics`), orderBy('date', 'asc'));
    const unsubMetrics = onSnapshot(qMetrics, (snapshot) => {
      const fetchedMetrics = snapshot.docs.map(doc => doc.data());
      setMetrics(fetchedMetrics);

      // Auto-select first exercise if not set
      if (fetchedMetrics.length > 0) {
         const uniqueExercises = Array.from(new Set(fetchedMetrics.map(m => m.exercise)));
         if (uniqueExercises.length > 0 && !selectedExercise) {
             setSelectedExercise(uniqueExercises[0] as string);
         }
      }
    });

    return () => {
      unsubSessions();
      unsubMetrics();
    };
  }, [user?.id]);

  // Derived Stats
  const totalSessions = sessions.length;

  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSessions = sessions.filter(s => {
      const dateStr = s.date?.toDate ? s.date.toDate().toISOString() : s.date;
      return dateStr?.startsWith(currentYearMonth);
  }).length;

  const todayStr = today.toISOString().split('T')[0];
  const futureSessions = sessions
      .filter(s => {
          const dateStr = s.date?.toDate ? s.date.toDate().toISOString().split('T')[0] : s.date;
          return dateStr >= todayStr;
      })
      .sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate().toISOString() : a.date;
          const dateB = b.date?.toDate ? b.date.toDate().toISOString() : b.date;
          return dateA.localeCompare(dateB);
      });
  const nextSession = futureSessions[0];
  const nextSessionLabel = nextSession
      ? `${nextSession.date?.toDate ? nextSession.date.toDate().toISOString().split('T')[0] : nextSession.date} ${nextSession.time || ''}`
      : 'Sin agendar';

  const currentPlan = user?.plan || 'Sin plan';

  // Group sessions by month for BarChart
  const groupSessionsByMonth = (sessionsArr: any[]) => {
      const counts: Record<string, number> = {};
      sessionsArr.forEach(s => {
          const dateObj = s.date?.toDate ? s.date.toDate() : new Date(s.date);
          if (isNaN(dateObj.getTime())) return;
          const monthName = dateObj.toLocaleString('es-ES', { month: 'short' });
          const key = `${monthName} ${dateObj.getFullYear()}`;
          counts[key] = (counts[key] || 0) + 1;
      });
      // Convert to array
      return Object.entries(counts).map(([month, count]) => ({ month, sesiones: count }));
  };
  const sessionsByMonth = groupSessionsByMonth(sessions);

  // Filter metrics for LineChart
  const uniqueExercises = Array.from(new Set(metrics.map(m => m.exercise)));
  const filteredMetrics = metrics.filter(m => m.exercise === selectedExercise);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-black text-gray-900 mb-8">Mi Perfil & Estadísticas</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-3"><Dumbbell size={24} /></div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Sesiones</p>
            <p className="text-3xl font-black text-gray-900">{totalSessions}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-green-100 text-green-600 rounded-full mb-3"><Calendar size={24} /></div>
            <p className="text-gray-500 text-sm font-medium mb-1">Este Mes</p>
            <p className="text-3xl font-black text-gray-900">{thisMonthSessions}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-3"><Zap size={24} /></div>
            <p className="text-gray-500 text-sm font-medium mb-1">Próxima Sesión</p>
            <p className="text-lg font-bold text-gray-900 break-words w-full">{nextSessionLabel}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full mb-3"><Star size={24} /></div>
            <p className="text-gray-500 text-sm font-medium mb-1">Plan Actual</p>
            <p className="text-lg font-bold text-gray-900 uppercase tracking-wide">{currentPlan}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Chart 1: Sessions by Month */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sesiones por mes</h3>
            {sessionsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sessionsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="sesiones" fill="#2563eb" radius={[4,4,0,0]} isAnimationActive={true} animationDuration={800} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400">Sin datos de sesiones.</div>
            )}
        </div>

        {/* Chart 2: Progression */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Progresión de carga</h3>
                {uniqueExercises.length > 0 && (
                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 focus:ring-blue-500 outline-none"
                    >
                        {uniqueExercises.map(ex => (
                            <option key={ex as string} value={ex as string}>{ex}</option>
                        ))}
                    </select>
                )}
            </div>

            {filteredMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                <LineChart data={filteredMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} unit=" kg" />
                    <Tooltip />
                    <Line type="monotone" dataKey="load" name="Carga" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={1000} />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-center">
                    No hay métricas registradas.<br/>El entrenador actualizará tu progreso pronto.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClientStatsView;
