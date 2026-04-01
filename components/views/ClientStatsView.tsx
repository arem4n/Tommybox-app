import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
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

  const [weightLogs, setWeightLogs] = useState<any[]>([]);

  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [build, setBuild] = useState(user?.build || '');

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

    const qWeight = query(collection(db, `users/${user.id}/weightLogs`), orderBy('date', 'asc'));
    const unsubWeight = onSnapshot(qWeight, (snapshot) => {
        setWeightLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSessions();
      unsubMetrics();
      unsubWeight();
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
    
    let nextLabel = 'Sin agendar';
    if (next) {
        const nextDateStr = next.date?.toDate ? next.date.toDate().toISOString().split('T')[0] : next.date;
        const [y, m, d] = nextDateStr.split('-').map(Number);
        const sessionDate = new Date(y, m - 1, d);
        sessionDate.setHours(0,0,0,0);

        const current = new Date();
        current.setHours(0,0,0,0);

        const diffTime = sessionDate.getTime() - current.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const timeStr = next.time ? `a las ${next.time} hrs` : '';

        if (diffDays === 0) {
             nextLabel = `Hoy ${timeStr}`;
        } else if (diffDays === 1) {
             nextLabel = `Mañana ${timeStr}`;
        } else if (diffDays > 1 && diffDays < 7) {
             const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
             nextLabel = `${days[sessionDate.getDay()]} ${timeStr}`;
        } else {
             nextLabel = `${sessionDate.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} ${timeStr}`;
        }
        nextLabel = nextLabel.trim();
    }

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
          const newWeight = weight ? parseFloat(weight.toString()) : null;
          await updateDoc(doc(db, 'users', user.id), {
              displayName: editName.trim(),
              photoURL: photoURL.trim() || null,
              weight: newWeight,
              height: height ? parseFloat(height.toString()) : null,
              build: build.trim() || null,
          });

          if (newWeight !== null && newWeight !== user.weight) {
               await addDoc(collection(db, `users/${user.id}/weightLogs`), {
                   weight: newWeight,
                   date: new Date().toISOString().split('T')[0],
                   timestamp: Timestamp.now()
               });
          }

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
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-blue-100/10 text-blue-500 rounded-full mb-3"><Dumbbell size={24} /></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Sesiones</p>
                        <p className="text-3xl font-black text-white">{totalSessions}</p>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-green-100/10 text-green-500 rounded-full mb-3"><Calendar size={24} /></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Este Mes</p>
                        <p className="text-3xl font-black text-white">{thisMonthSessions}</p>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-purple-100/10 text-purple-500 rounded-full mb-3"><Zap size={24} /></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Próxima Sesión</p>
                        <p className="text-lg font-bold text-white break-words w-full">{nextSessionLabel}</p>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-yellow-100/10 text-yellow-500 rounded-full mb-3"><Star size={24} /></div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Plan Actual</p>
                        <p className="text-lg font-bold text-white uppercase tracking-wide">{currentPlan}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 mb-6">
                        <h3 className="text-lg font-bold text-white mb-4">Sesiones por mes</h3>
                        {sessionsByMonth.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={sessionsByMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} />
                                <Bar dataKey="sesiones" fill="#3b82f6" radius={[4,4,0,0]} isAnimationActive={true} animationDuration={800} />
                            </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-slate-500">Sin datos de sesiones.</div>
                        )}
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-bold text-white">Progresión de carga</h3>
                            {uniqueExercises.length > 0 && (
                                <select
                                    value={selectedExercise}
                                    onChange={(e) => setSelectedExercise(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:ring-blue-500 outline-none"
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
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" kg" />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} />
                                <Line type="monotone" dataKey="load" name="Carga" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#3b82f6', r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={1000} />
                            </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-slate-500 text-center">
                                No hay métricas registradas.<br/>El entrenador actualizará tu progreso pronto.
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-bold text-white">Evolución de Peso</h3>
                        </div>

                        {weightLogs.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={weightLogs}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" kg" domain={['dataMin - 1', 'dataMax + 1']} />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}} />
                                <Line type="monotone" dataKey="weight" name="Peso" stroke="#10b981" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#10b981', r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={1000} />
                            </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-slate-500 text-center">
                                Registra tu peso actual en la pestaña "Perfil"<br/>para visualizar tu evolución gráfica aquí.
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'Rendimiento' && (
             <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold border-b border-slate-700">Fecha</th>
                                <th className="p-4 font-bold border-b border-slate-700">Ejercicio</th>
                                <th className="p-4 font-bold border-b border-slate-700">Carga (kg)</th>
                                <th className="p-4 font-bold border-b border-slate-700">Reps</th>
                                <th className="p-4 font-bold border-b border-slate-700">RPE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {metrics.map(m => (
                                <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm text-white">{m.date}</td>
                                    <td className="p-4 text-sm font-bold text-white">{m.exercise}</td>
                                    <td className="p-4 text-sm text-slate-300 font-medium">{m.load} kg</td>
                                    <td className="p-4 text-sm text-slate-300">{m.reps}</td>
                                    <td className="p-4 text-sm text-slate-500">{m.rpe || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {metrics.length === 0 && (
                        <div className="p-12 text-center text-slate-500">Tu entrenador aún no ha registrado datos de rendimiento.</div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'Perfil' && (
             <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8 max-w-2xl mx-auto mt-4">
                 <h2 className="text-2xl font-black text-white mb-8 text-center">Editar Perfil</h2>

                 <div className="flex flex-col items-center mb-8">
                     <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center mb-4 border-4 border-slate-900 shadow-lg relative group">
                       {photoURL ? (
                         <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-4xl font-black text-slate-300">
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
                         className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                       >
                         Cambiar Foto
                       </button>
                     </div>
                 </div>

                 <div className="mb-6 max-w-sm mx-auto">
                   <label className="block text-sm font-medium text-slate-300 mb-2">
                     Nombre o apodo
                   </label>
                   <input
                     type="text"
                     value={editName}
                     onChange={e => setEditName(e.target.value)}
                     maxLength={30}
                     placeholder="¿Cómo quieres que te llamemos?"
                     className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                   <p className="text-xs text-slate-500 mt-1">{editName.length}/30 caracteres</p>
                 </div>

                 <div className="mb-6 max-w-sm mx-auto grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-300 mb-2">Peso (kg)</label>
                     <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej: 75.5" className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-300 mb-2">Estatura (cm)</label>
                     <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="Ej: 175" className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-300 mb-2">Complexión Física</label>
                     <input type="text" value={build} onChange={e => setBuild(e.target.value)} placeholder="Ej: Atlética, Ectomorfo..." className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                   </div>
                 </div>

                 <div className="max-w-sm mx-auto space-y-2 mb-8">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-400">Email</span>
                     <span className="font-medium text-white">{user?.email}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-400">Plan activo</span>
                     <span className="font-medium text-blue-400">{user?.plan ? getPlanName(user.plan) : 'Sin plan'}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-400">Miembro desde</span>
                     <span className="font-medium text-white">
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
