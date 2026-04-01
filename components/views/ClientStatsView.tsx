import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Dumbbell, Zap, Star, Camera } from 'lucide-react';
import { getPlanName } from '../../utils/plans';

interface Props {
  user: any;
  onUserUpdate: (updated: any) => void;
  isTrainerView?: boolean;
}

const ClientStatsView = ({ user, onUserUpdate, isTrainerView }: Props) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  // Profile Editor State
  const [editName, setEditName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const thisMonthSessions = useMemo(() => {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return sessions.filter(s => {
        const dateStr = s.date?.toDate ? s.date.toDate().toISOString() : s.date;
        return dateStr?.startsWith(currentYearMonth);
    }).length;
  }, [sessions]);

  const { futureSessions, nextSessionLabel } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const future = sessions
        .filter(s => {
            const dateStr = s.date?.toDate ? s.date.toDate().toISOString().split('T')[0] : s.date;
            return dateStr >= todayStr;
        })
        .sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate().toISOString() : a.date;
            const dateB = b.date?.toDate ? b.date.toDate().toISOString() : b.date;
            return dateA.localeCompare(dateB);
        });
    const next = future[0];
    const nextLabel = next
        ? `${next.date?.toDate ? next.date.toDate().toISOString().split('T')[0] : next.date} ${next.time || ''}`
        : 'Sin agendar';
    return { futureSessions: future, nextSessionLabel: nextLabel };
  }, [sessions]);

  const currentPlan = user?.plan ? getPlanName(user.plan) : 'Sin plan';

  const sessionsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
        const dateObj = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        if (isNaN(dateObj.getTime())) return;
        const monthName = dateObj.toLocaleString('es-ES', { month: 'short' });
        const key = `${monthName} ${dateObj.getFullYear()}`;
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([month, count]) => ({ month, sesiones: count }));
  }, [sessions]);

  const uniqueExercises = useMemo(() =>
    Array.from(new Set(metrics.map(m => (m as any).exercise)))
  , [metrics]);

  // Sort ascending for chart
  const filteredMetrics = useMemo(() =>
    [...metrics]
      .filter(m => (m as any).exercise === selectedExercise)
      .sort((a, b) => a.date.localeCompare(b.date))
  , [metrics, selectedExercise]);

  const handleSaveProfile = async () => {
      if (!editName.trim() || !user?.id) return;
      setSaving(true);
      try {
          await updateDoc(doc(db, 'users', user.id), {
              displayName: editName.trim(),
              photoURL: photoURL.trim() || null,
          });
          setSaveMsg('¡Perfil actualizado correctamente!');
          // Optionally trigger onUserUpdate here if needed
          setTimeout(() => setSaveMsg(''), 3000);
      } catch(e) {
          setSaveMsg('Error al guardar. Intenta de nuevo.');
      } finally {
          setSaving(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 150;
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress to 60% quality base64
              setPhotoURL(dataUrl);
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="flex border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('Estadísticas')} className={`py-2 px-4 border-b-2 font-medium ${activeTab === 'Estadísticas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Estadísticas</button>
            <button onClick={() => setActiveTab('Rendimiento')} className={`py-2 px-4 border-b-2 font-medium ${activeTab === 'Rendimiento' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Rendimiento</button>
            {!isTrainerView && (
                <button onClick={() => setActiveTab('Perfil')} className={`py-2 px-4 border-b-2 font-medium ${activeTab === 'Perfil' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Perfil</button>
            )}
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

                <div className="grid lg:grid-cols-2 gap-8">
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
                     <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center mb-4 border-4 border-white shadow-lg relative group">
                       {photoURL ? (
                         <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-4xl font-black text-blue-600">
                           {editName?.[0]?.toUpperCase() || '?'}
                         </span>
                       )}
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       >
                         <Camera className="text-white" size={24} />
                       </div>
                     </div>

                     <div className="w-full max-w-sm flex justify-center">
                       <input 
                         type="file" 
                         accept="image/*" 
                         capture="user"
                         ref={fileInputRef} 
                         onChange={handleImageUpload} 
                         className="hidden" 
                       />
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                       >
                         Cambiar Foto
                       </button>
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
                     <span className="font-medium text-blue-600">{user?.plan ? getPlanName(user.plan) : 'Sin plan'}</span>
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
                   {saveMsg && <p className="text-center text-sm text-green-600 mt-3 font-medium">{saveMsg}</p>}
                 </div>
             </div>
        )}
    </div>
  );
};

export default ClientStatsView;
