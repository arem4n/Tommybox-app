import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, deleteDoc, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Calendar, Dumbbell, Zap, Star, Camera, AlertTriangle, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { getPlanName } from '../../utils/plans';
import { AppUser, Restriction, SESSION_TYPE_CONFIG, SessionType } from '../../types';

interface Props {
  user: AppUser;
  onUserUpdate: (updated: any) => void;
  isTrainerView?: boolean;
}

// ── ISO week helper ────────────────────────────────────────────────────────────
const getISOWeekLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

const SEVERITY_STYLES = {
  leve:     { label: 'Leve',     bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  moderada: { label: 'Moderada', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  severa:   { label: 'Severa',   bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300' },
};

const SESSION_TYPES = Object.keys(SESSION_TYPE_CONFIG) as SessionType[];

const ClientStatsView = ({ user, onUserUpdate, isTrainerView }: Props) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);

  // Profile Editor State
  const [editName, setEditName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [photoLoading, setPhotoLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [build, setBuild] = useState(user?.build || '');

  // Restriction form state
  const [newDescription, setNewDescription] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newSeverity, setNewSeverity] = useState<'leve' | 'moderada' | 'severa'>('leve');
  const [savingRestriction, setSavingRestriction] = useState(false);

  // Weekly chart range
  const [weekRange, setWeekRange] = useState<4 | 8 | 12>(8);

  const fileInputRef = useRef<HTMLInputElement>(null);

  type Tab = 'Estadísticas' | 'Rendimiento' | 'Restricciones' | 'Perfil';
  const availableTabs: Tab[] = isTrainerView
    ? ['Estadísticas', 'Rendimiento', 'Restricciones']
    : ['Estadísticas', 'Rendimiento', 'Perfil'];
  const [activeTab, setActiveTab] = useState<Tab>('Estadísticas');

  // ── Load photo from subcollection (lightweight — not in main user doc) ──────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getDoc(doc(db!, `users/${user.id}/photo/main`)).then((snap) => {
      if (!cancelled && snap.exists()) {
        setPhotoURL(snap.data().photoURL || '');
      }
      if (!cancelled) setPhotoLoading(false);
    }).catch(() => setPhotoLoading(false));
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── Firestore subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const unsubSessions = onSnapshot(query(collection(db!, `agenda/${user.id}/events`)), (s) =>
      setSessions(s.docs.map((d) => d.data()))
    );
    const unsubMetrics = onSnapshot(
      query(collection(db!, `users/${user.id}/metrics`), orderBy('date', 'asc')),
      (s) => {
        const fetched = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMetrics([...fetched].sort((a, b) => (b as any).date.localeCompare((a as any).date)));
        if (fetched.length > 0 && !selectedExercise) {
          const first = (fetched[0] as any).exercise;
          if (first) setSelectedExercise(first);
        }
      }
    );
    const unsubWeight = onSnapshot(
      query(collection(db!, `users/${user.id}/weightLogs`), orderBy('date', 'asc')),
      (s) => setWeightLogs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubRestrictions = onSnapshot(
      query(collection(db!, `users/${user.id}/restrictions`), orderBy('createdAt', 'desc')),
      (s) => setRestrictions(s.docs.map((d) => ({ id: d.id, ...d.data() } as Restriction)))
    );
    return () => { unsubSessions(); unsubMetrics(); unsubWeight(); unsubRestrictions(); };
  }, [user?.id]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalSessions = sessions.length;

  const thisMonthSessions = useMemo(() => {
    const ym = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return sessions.filter((s) => (s.date?.toDate ? s.date.toDate().toISOString() : s.date)?.startsWith(ym)).length;
  }, [sessions]);

  const { nextSessionLabel } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const future = sessions
      .filter((s) => (s.date?.toDate ? s.date.toDate().toISOString().split('T')[0] : s.date) >= todayStr)
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate().toISOString() : a.date;
        const db2 = b.date?.toDate ? b.date.toDate().toISOString() : b.date;
        return da.localeCompare(db2);
      });
    const next = future[0];
    let label = 'Sin agendar';
    if (next) {
      const ds = next.date?.toDate ? next.date.toDate().toISOString().split('T')[0] : next.date;
      const [y, m, d] = ds.split('-').map(Number);
      const sd = new Date(y, m - 1, d);
      const today = new Date(); today.setHours(0,0,0,0); sd.setHours(0,0,0,0);
      const diff = Math.round((sd.getTime() - today.getTime()) / 86400000);
      const t = next.time ? `a las ${next.time}` : '';
      const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      if (diff === 0) label = `Hoy ${t}`;
      else if (diff === 1) label = `Mañana ${t}`;
      else if (diff < 7) label = `${DAY_NAMES[sd.getDay()]} ${t}`;
      else label = `${sd.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} ${t}`;
      label = label.trim();
    }
    return { nextSessionLabel: label };
  }, [sessions]);

  const sessionsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.toLocaleString('es-ES', { month: 'short' })} ${d.getFullYear()}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([month, sesiones]) => ({ month, sesiones }));
  }, [sessions]);

  // ── Weekly volume by sessionType ──────────────────────────────────────────
  const weeklyVolumeData = useMemo(() => {
    const weeks: Record<string, Record<string, number>> = {};
    sessions.forEach((s) => {
      const dateStr = s.date?.toDate ? s.date.toDate().toISOString().split('T')[0] : s.date;
      if (!dateStr) return;
      const week = getISOWeekLabel(dateStr);
      const type: string = s.sessionType ?? 'Fuerza';
      if (!weeks[week]) weeks[week] = {};
      weeks[week][type] = (weeks[week][type] || 0) + 1;
    });
    return Object.entries(weeks)
      .map(([week, types]) => ({ week, ...types }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-weekRange);
  }, [sessions, weekRange]);

  // ── Metrics ──────────────────────────────────────────────────────────────
  const uniqueExercises = useMemo(() => Array.from(new Set(metrics.map((m: any) => m.exercise))), [metrics]);
  const filteredMetrics = useMemo(() =>
    [...metrics].filter((m: any) => m.exercise === selectedExercise).sort((a, b) => a.date.localeCompare(b.date))
  , [metrics, selectedExercise]);
  const totalVolume = useMemo(() => filteredMetrics.reduce((acc, m) => acc + ((m.load || 0) * (m.reps || 0)), 0), [filteredMetrics]);
  const maxLoad = useMemo(() => filteredMetrics.reduce((max, m) => Math.max(max, m.load || 0), 0), [filteredMetrics]);

  // ── Active restrictions ────────────────────────────────────────────────────
  const activeRestrictions = restrictions.filter((r) => r.active);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim() || !user?.id) return;
    setSaving(true);
    try {
      const newWeight = weight ? parseFloat(weight.toString()) : null;

      // ── Main user doc — no photoURL here (lives in subcollection) ────────────
      await updateDoc(doc(db!, 'users', user.id), {
        displayName: editName.trim(),
        weight: newWeight,
        height: height ? parseFloat(height.toString()) : null,
        build: build.trim() || null,
      });

      // ── Photo — separate subcollection to keep user doc lightweight ──────────
      if (photoURL.trim()) {
        await setDoc(doc(db!, `users/${user.id}/photo/main`), {
          photoURL: photoURL.trim(),
          updatedAt: Timestamp.now(),
        });
      }

      if (newWeight !== null && newWeight !== user.weight) {
        await addDoc(collection(db!, `users/${user.id}/weightLogs`), {
          weight: newWeight, date: new Date().toISOString().split('T')[0], timestamp: Timestamp.now(),
        });
      }
      setSaveMsg('¡Perfil actualizado correctamente!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveMsg('Error al guardar. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 150;
        canvas.width = MAX;
        canvas.height = img.height * (MAX / img.width);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoURL(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddRestriction = async () => {
    if (!newDescription.trim() || !newZone.trim() || !user?.id) return;
    setSavingRestriction(true);
    try {
      await addDoc(collection(db!, `users/${user.id}/restrictions`), {
        description: newDescription.trim(),
        affectedZone: newZone.trim(),
        severity: newSeverity,
        active: true,
        createdAt: Timestamp.now(),
      });
      setNewDescription(''); setNewZone(''); setNewSeverity('leve');
    } finally { setSavingRestriction(false); }
  };

  const handleToggleRestriction = async (r: Restriction) => {
    if (!user?.id) return;
    await updateDoc(doc(db!, `users/${user.id}/restrictions`, r.id), {
      active: !r.active,
      ...(r.active ? { resolvedAt: Timestamp.now() } : { resolvedAt: null }),
    });
  };

  const handleDeleteRestriction = async (id: string) => {
    if (!user?.id) return;
    await deleteDoc(doc(db!, `users/${user.id}/restrictions`, id));
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 border-b-2 font-medium ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            {tab}
            {tab === 'Restricciones' && activeRestrictions.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 inline-flex items-center justify-center">
                {activeRestrictions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Estadísticas ── */}
      {activeTab === 'Estadísticas' && (
        <>
          {/* Active restrictions banner (trainer only) */}
          {isTrainerView && activeRestrictions.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-black text-red-700 text-sm">
                  {activeRestrictions.length} restricción{activeRestrictions.length > 1 ? 'es' : ''} activa{activeRestrictions.length > 1 ? 's' : ''}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {activeRestrictions.map((r) => `${r.description} (${r.affectedZone})`).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="mb-3"><img src="/custom-icons/sesiones_totales.png" className="w-12 h-12 object-contain" alt="Total Sesiones" /></div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Sesiones</p>
              <p className="text-3xl font-black text-white">{totalSessions}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="mb-3"><img src="/custom-icons/sesion_agendada.png" className="w-12 h-12 object-contain" alt="Este Mes" /></div>
              <p className="text-slate-400 text-sm font-medium mb-1">Este Mes</p>
              <p className="text-3xl font-black text-white">{thisMonthSessions}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="mb-3"><img src="/custom-icons/proxima_sesion.png" className="w-12 h-12 object-contain" alt="Próxima Sesión" /></div>
              <p className="text-slate-400 text-sm font-medium mb-1">Próxima Sesión</p>
              <p className="text-lg font-bold text-white break-words w-full">{nextSessionLabel}</p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="mb-3"><img src="/custom-icons/plan_activo.png" className="w-12 h-12 object-contain" alt="Plan Actual" /></div>
              <p className="text-slate-400 text-sm font-medium mb-1">Plan Actual</p>
              <p className="text-lg font-bold text-white uppercase tracking-wide">{user?.plan ? getPlanName(user.plan) : 'Sin plan'}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Sessions by month */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Sesiones por mes</h3>
              {sessionsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sessionsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Bar dataKey="sesiones" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-500">Sin datos de sesiones.</div>
              )}
            </div>

            {/* Weekly volume by session type */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Distribución semanal</h3>
                <select
                  value={weekRange}
                  onChange={(e) => setWeekRange(Number(e.target.value) as 4 | 8 | 12)}
                  className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 outline-none"
                >
                  <option value={4}>4 semanas</option>
                  <option value={8}>8 semanas</option>
                  <option value={12}>12 semanas</option>
                </select>
              </div>
              {weeklyVolumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    {SESSION_TYPES.map((t) => (
                      <Bar key={t} dataKey={t} stackId="a" fill={SESSION_TYPE_CONFIG[t].color}
                        radius={t === 'Deload' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        isAnimationActive animationDuration={800}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-500 text-center text-sm">
                  Las sesiones agendadas con tipo aparecerán aquí.<br />Empieza a agendar con tipo seleccionado.
                </div>
              )}
            </div>

            {/* Load progression */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-white">Progresión de carga</h3>
                {uniqueExercises.length > 0 && (
                  <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 outline-none">
                    {uniqueExercises.map((ex) => <option key={ex as string} value={ex as string}>{ex}</option>)}
                  </select>
                )}
              </div>
              {filteredMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" kg" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Line type="monotone" dataKey="load" name="Carga" stroke="#3b82f6" strokeWidth={3}
                      dot={{ fill: '#0f172a', stroke: '#3b82f6', r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }} isAnimationActive animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-500 text-center">
                  No hay métricas registradas.<br />El entrenador actualizará tu progreso pronto.
                </div>
              )}
            </div>

            {/* Weight evolution */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Evolución de Peso</h3>
              {weightLogs.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weightLogs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" kg" domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Line type="monotone" dataKey="weight" name="Peso" stroke="#10b981" strokeWidth={3}
                      dot={{ fill: '#0f172a', stroke: '#10b981', r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }} isAnimationActive animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-500 text-center">
                  Registra tu peso actual en la pestaña "Perfil"<br />para visualizar tu evolución gráfica aquí.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Rendimiento ── */}
      {activeTab === 'Rendimiento' && (
        <>
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
                  {metrics.map((m) => (
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
          {filteredMetrics.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                <p className="text-slate-400 text-xs font-medium mb-1">Carga Máxima — {selectedExercise}</p>
                <p className="text-2xl font-black text-white">{maxLoad} <span className="text-sm text-slate-400">kg</span></p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                <p className="text-slate-400 text-xs font-medium mb-1">Volumen Total Acumulado</p>
                <p className="text-2xl font-black text-blue-400">{totalVolume.toLocaleString('es-CL')} <span className="text-sm text-slate-400">kg</span></p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Restricciones (trainer only) ── */}
      {activeTab === 'Restricciones' && isTrainerView && (
        <div className="space-y-6">
          {/* Add restriction form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-400" /> Nueva restricción
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
                <input
                  type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ej: Dolor lumbar, lesión de rodilla..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Zona afectada</label>
                <input
                  type="text" value={newZone} onChange={(e) => setNewZone(e.target.value)}
                  placeholder="Ej: Espalda baja, Rodilla derecha..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Severidad:</label>
              {(['leve', 'moderada', 'severa'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setNewSeverity(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                    newSeverity === s
                      ? `${SEVERITY_STYLES[s].bg} ${SEVERITY_STYLES[s].text} ${SEVERITY_STYLES[s].border}`
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {SEVERITY_STYLES[s].label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddRestriction}
              disabled={savingRestriction || !newDescription.trim() || !newZone.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {savingRestriction ? 'Guardando...' : 'Agregar restricción'}
            </button>
          </div>

          {/* Restriction list */}
          {restrictions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No hay restricciones registradas.</div>
          ) : (
            <div className="space-y-3">
              {restrictions.map((r) => {
                const sv = SEVERITY_STYLES[r.severity];
                return (
                  <div
                    key={r.id}
                    className={`bg-slate-900 border rounded-2xl p-4 flex items-start gap-4 transition-opacity ${!r.active ? 'opacity-50' : ''}`}
                  >
                    <div className={`mt-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black ${sv.bg} ${sv.text} ${sv.border} border whitespace-nowrap flex-shrink-0`}>
                      {sv.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{r.description}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Zona: {r.affectedZone}</p>
                      {r.resolvedAt && (
                        <p className="text-slate-500 text-xs mt-0.5">
                          Resuelta: {(r.resolvedAt as any).toDate?.().toLocaleDateString('es-CL') ?? ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleRestriction(r)}
                        title={r.active ? 'Marcar como resuelta' : 'Reactivar'}
                        className={`p-1.5 rounded-lg transition-colors ${r.active ? 'text-green-400 hover:bg-green-900/30' : 'text-slate-500 hover:bg-slate-800'}`}
                      >
                        {r.active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteRestriction(r.id)}
                        className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Perfil (client only) ── */}
      {activeTab === 'Perfil' && (
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8 max-w-2xl mx-auto mt-4">
          <h2 className="text-2xl font-black text-white mb-8 text-center">Editar Perfil</h2>
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center mb-4 border-4 border-slate-900 shadow-lg relative group">
              {photoLoading ? (
                <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
              ) : photoURL ? (
                <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-slate-300">{editName?.[0]?.toUpperCase() || '?'}</span>
              )}
              <div onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <div className="w-full max-w-sm flex justify-center">
              <input type="file" accept="image/*" capture="user" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                Cambiar Foto
              </button>
            </div>
          </div>

          <div className="mb-6 max-w-sm mx-auto">
            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre o apodo</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={30}
              placeholder="¿Cómo quieres que te llamemos?"
              className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
            <p className="text-xs text-slate-500 mt-1">{editName.length}/30 caracteres</p>
          </div>

          <div className="mb-6 max-w-sm mx-auto grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Peso (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej: 75.5"
                className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Estatura (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ej: 175"
                className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Complexión Física</label>
              <input type="text" value={build} onChange={(e) => setBuild(e.target.value)} placeholder="Ej: Atlética, Ectomorfo..."
                className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
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
                {(user?.createdAt as any)?.toDate ? (user.createdAt as any).toDate().toLocaleDateString('es-CL') : '—'}
              </span>
            </div>
          </div>

          <div className="max-w-sm mx-auto">
            <button onClick={handleSaveProfile} disabled={saving}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
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
