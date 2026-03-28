import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Dumbbell, Zap, Star, Download } from 'lucide-react';

interface Props {
  user: any;
  onUserUpdate: (updated: any) => void;
}

const ClientStatsView = ({ user, onUserUpdate }: Props) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  // Profile Editor State
  const [editName, setEditName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'Estadísticas' | 'Rendimiento' | 'Perfil'>('Estadísticas');

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to sessions
    const qSessions = query(collection(db, `agenda/${user.id}/events`));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      setSessions(snapshot.docs.map(d => d.data()));
    });

    // Subscribe to metrics
    const qMetrics = query(collection(db, `users/${user.id}/metrics`), orderBy('date', 'asc'));
    const unsubMetrics = onSnapshot(qMetrics, (snapshot) => {
      const fetchedMetrics = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // ensure descending order for the table
      const sortedMetrics = [...fetchedMetrics].sort((a,b) => (b as any).date.localeCompare((a as any).date));
      setMetrics(sortedMetrics);

      // Auto-select first exercise if not set
      if (fetchedMetrics.length > 0) {
         const uniqueExercises = Array.from(new Set(fetchedMetrics.map(m => (m as any).exercise)));
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
  const exportToCSV = () => {
  if (metrics.length === 0) return;
  const header = 'Fecha,Ejercicio,Carga (kg),Reps,RPE\n';
  const rows = metrics.map((m: any) => `${m.date},${m.exercise},${m.load},${m.reps},${m.rpe || ''}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tommybox_mis_metricas.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const groupSessionsByMonth = (sessionsArr: any[]) => {
      const counts: Record<string, number> = {};
      sessionsArr.forEach(s => {
          const dateObj = s.date?.toDate ? s.date.toDate() : new Date(s.date);
          if (isNaN(dateObj.getTime())) return;
          const monthName = dateObj.toLocaleString('es-ES', { month: 'short' });
          const key = `${monthName} ${dateObj.getFullYear()}`;
          counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts).map(([month, count]) => ({ month, sesiones: count }));
  };
  const sessionsByMonth = groupSessionsByMonth(sessions);

  const uniqueExercises = Array.from(new Set(metrics.map(m => (m as any).exercise)));

  // Sort ascending for chart
  const filteredMetrics = [...metrics]
      .filter(m => (m as any).exercise === selectedExercise)
      .sort((a, b) => a.date.localeCompare(b.date));

  const handleSaveProfile = async () => {
  if (!editName.trim() || !user?.id) return;
  setSaving(true);
  setSaveMsg('');
  try {
    await updateDoc(doc(db, 'users', user.id), {
      displayName: editName.trim(),
      photoURL: photoURL.trim() || null,
    });
    // Update local state to reflect immediately
    onUserUpdate({ ...user, displayName: editName.trim(), photoURL: photoURL.trim() || null });
    setSaveMsg('¡Perfil actualizado correctamente!');
    setTimeout(() => setSaveMsg(''), 3000);
  } catch (e) {
    console.error(e);
    setSaveMsg('Error al guardar. Intenta de nuevo.');
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="max-w-6xl mx-auto animate-fade-in min-h-screen py-4">
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
  {(['Estadísticas', 'Rendimiento', 'Perfil'] as const).map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-3 text-sm font-medium transition-colors ${
        activeTab === tab
          ? 'bg-blue-600 text-white'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {tab}
    </button>
  ))}
</div>

        {activeTab === 'Estadísticas' && (
            <>
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

                <div className="flex justify-end mb-4">
  <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
    <Download size={16} /> Descargar CSV
  </button>
</div>
<div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Sesiones por mes</h3>
                        {sessionsByMonth.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={sessionsByMonth}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
  <Bar dataKey="sesiones" fill="#2563eb" radius={[4,4,0,0]} isAnimationActive={true} animationDuration={800} />
</BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400">Sin datos de sesiones.</div>
                        )}
                    </div>

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
                            <AreaChart data={filteredMetrics}>
  <defs>
    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} unit=" kg" axisLine={false} tickLine={false} />
  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
  <Area type="monotone" dataKey="load" name="Carga" stroke="#2563eb" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={3} activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} isAnimationActive={true} animationDuration={1000} />
</AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-center">
                                No hay métricas registradas.<br/>El entrenador actualizará tu progreso pronto.
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'Rendimiento' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold border-b border-gray-100">Fecha</th>
                                <th className="p-4 font-bold border-b border-gray-100">Ejercicio</th>
                                <th className="p-4 font-bold border-b border-gray-100">Carga (kg)</th>
                                <th className="p-4 font-bold border-b border-gray-100">Reps</th>
                                <th className="p-4 font-bold border-b border-gray-100">RPE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {metrics.map(m => (
                                <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 text-sm text-gray-900">{m.date}</td>
                                    <td className="p-4 text-sm font-bold text-gray-900">{m.exercise}</td>
                                    <td className="p-4 text-sm text-gray-700 font-medium">{m.load} kg</td>
                                    <td className="p-4 text-sm text-gray-700">{m.reps}</td>
                                    <td className="p-4 text-sm text-gray-500">{m.rpe || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {metrics.length === 0 && (
                        <div className="p-12 text-center text-gray-500">Tu entrenador aún no ha registrado datos de rendimiento.</div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'Perfil' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto mt-4">
                 <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Editar Perfil</h2>

                 <div className="flex flex-col items-center mb-8">
                     <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                       {photoURL ? (
                         <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-4xl font-black text-blue-600">
                           {editName?.[0]?.toUpperCase() || '?'}
                         </span>
                       )}
                     </div>

                     <div className="w-full max-w-sm">
                       <label className="block text-xs font-medium text-gray-500 mb-1">
                         URL de foto de perfil
                       </label>
                       <input
                         type="url"
                         value={photoURL}
                         onChange={e => setPhotoURL(e.target.value)}
                         placeholder="https://... (pega un enlace a tu foto)"
                         className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                       <p className="text-xs text-gray-400 mt-1">
                         Puedes usar una foto de Google, Instagram, etc.
                       </p>
                     </div>
                 </div>

                 <div className="mb-6 max-w-sm mx-auto">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Nombre o apodo
                   </label>
                   <input
                     type="text"
                     value={editName}
                     onChange={e => setEditName(e.target.value)}
                     maxLength={30}
                     placeholder="¿Cómo quieres que te llamemos?"
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                   <p className="text-xs text-gray-400 mt-1">{editName.length}/30 caracteres</p>
                 </div>

                 <div className="max-w-sm mx-auto space-y-2 mb-8">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Email</span>
                     <span className="font-medium text-gray-800">{user?.email}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Plan activo</span>
                     <span className="font-medium text-blue-600">{user?.plan || 'Sin plan'}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Miembro desde</span>
                     <span className="font-medium text-gray-800">
                       {user?.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('es-CL') : '—'}
                     </span>
                   </div>
                 </div>

                 <div className="max-w-sm mx-auto">
                   <button
                     onClick={handleSaveProfile}
                     disabled={saving}
                     className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                   >
                     {saving ? 'Guardando...' : 'Guardar cambios'}
                   </button>
                   {saveMsg && (
  <p className={`text-center text-sm mt-3 font-medium ${
    saveMsg.includes('Error') ? 'text-red-600' : 'text-green-600'
  }`}>
    {saveMsg}
  </p>
)}
                 </div>
             </div>
        )}
    </div>
  );
};

export default ClientStatsView;
