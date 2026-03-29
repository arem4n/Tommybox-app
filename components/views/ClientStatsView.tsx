import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Calendar, Dumbbell, Zap, Star, Camera, User, BarChart2, Heart, Download } from 'lucide-react';
import { getPlanName } from '../../utils/plans';

interface Props {
  user: any;
  onUserUpdate: (updated: any) => void;
}

const FEELING_OPTIONS = [
  { emoji: '🔥', label: 'Excelente', value: 5 },
  { emoji: '💪', label: 'Muy bien', value: 4 },
  { emoji: '😊', label: 'Bien',     value: 3 },
  { emoji: '😐', label: 'Regular',  value: 2 },
  { emoji: '😓', label: 'Cansado',  value: 1 },
];

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const ClientStatsView = ({ user, onUserUpdate }: Props) => {
  const [sessions, setSessions]       = useState<any[]>([]);
  const [metrics, setMetrics]         = useState<any[]>([]);
  const [feelings, setFeelings]       = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [activeTab, setActiveTab]     = useState<'stats'|'progress'|'feelings'|'profile'>('stats');

  // Profile state
  const [editName, setEditName]       = useState(user?.displayName || '');
  const [editContactEmail, setEditContactEmail] = useState(user?.contactEmail || '');
  const [editPhone, setEditPhone]     = useState(user?.phone || '');
  const [editBirthdate, setEditBirthdate] = useState(user?.birthDate || '');
  const [photoURL, setPhotoURL]       = useState(user?.photoURL || '');
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feeling form state

  const [feelingSelected, setFeelingSelected] = useState<number | null>(null);
  const [feelingText, setFeelingText]         = useState('');
  const [savingFeeling, setSavingFeeling]     = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const unsubS = onSnapshot(query(collection(db, `agenda/${user.id}/events`)), snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubM = onSnapshot(
      query(collection(db, `users/${user.id}/metrics`), orderBy('date', 'asc')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMetrics(data);
        if (data.length > 0 && !selectedExercise) {
          const uniq = Array.from(new Set(data.map((m: any) => m.exercise)));
          setSelectedExercise(uniq[0] as string);
        }
      }
    );
    const unsubF = onSnapshot(
      query(collection(db, `users/${user.id}/feelings`), orderBy('date', 'desc')),
      snap => setFeelings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubS(); unsubM(); unsubF(); };
  }, [user?.id]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentYM = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  const totalSessions   = sessions.length;
  const thisMonthCount  = sessions.filter(s => (s.date || '').startsWith(currentYM)).length;
  const nextSession     = sessions
    .filter(s => {
        const dateStr = s.date?.toDate ? s.date.toDate().toISOString().split('T')[0] : s.date;
        return dateStr >= todayStr;
    })
    .sort((a,b) => {
        const dateA = a.date?.toDate ? a.date.toDate().toISOString() : a.date;
        const dateB = b.date?.toDate ? b.date.toDate().toISOString() : b.date;
        return dateA.localeCompare(dateB);
    })[0];

  // Sessions grouped by last 6 months
  const sessionsByMonth = (() => {
    const map: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      map[key] = 0;
    }
    sessions.forEach(s => {
      const dateStr = s.date?.toDate ? s.date.toDate().toISOString() : s.date;
      if (dateStr && map[dateStr.slice(0,7)] !== undefined) map[dateStr.slice(0,7)]++;
    });
    return Object.entries(map).map(([k, v]) => ({
      month: MONTH_NAMES[parseInt(k.split('-')[1]) - 1],
      sesiones: v,
    }));
  })();

  // Metrics filtered by exercise
  const filteredMetrics = [...metrics].filter((m: any) => m.exercise === selectedExercise).sort((a, b) => a.date.localeCompare(b.date));
  const uniqueExercises = Array.from(new Set(metrics.map((m: any) => m.exercise)));

  // Feelings chart data (last 30 days, one point per day)
  const feelingsChartData = (() => {
    const map: Record<string, number> = {};
    feelings.forEach(f => { map[f.date] = f.value; });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, value]) => ({
        date: date.slice(5),
        estado: value,
        emoji: FEELING_OPTIONS.find(o => o.value === value)?.emoji || '',
      }));
  })();

  // ── Photo upload ────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(20);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        setUploadProgress(80);
        try {
          await updateDoc(doc(db, 'users', user.id), { photoURL: base64 });
          setPhotoURL(base64);
          if (typeof onUserUpdate === 'function') {
            onUserUpdate({ ...user, photoURL: base64 });
          }
          setUploadProgress(100);
          setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
        } catch (err) {
          console.error('Photo save error:', err);
          setUploading(false);
          setUploadProgress(0);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

    // ── Save profile ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const updates: any = {
        displayName: editName.trim(),
        contactEmail: editContactEmail.trim() || null,
        phone: editPhone.trim() || null,
        birthDate: editBirthdate || null,
      };
      if (photoURL) updates.photoURL = photoURL;
      await updateDoc(doc(db, 'users', user.id), updates);
      onUserUpdate({ ...user, ...updates });
      setSaveMsg('¡Perfil actualizado!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Save feeling ────────────────────────────────────────────────────────────
  const handleSaveFeeling = async () => {
    if (feelingSelected === null) return;
    setSavingFeeling(true);
    try {
      await addDoc(collection(db, `users/${user.id}/feelings`), {
        date: new Date().toISOString().split('T')[0],
        value: feelingSelected,
        emoji: FEELING_OPTIONS.find(o => o.value === feelingSelected)?.emoji || '',
        text: feelingText.trim() || null,
        timestamp: Timestamp.now(),
      });
      setFeelingSelected(null);
      setFeelingText('');

    } finally {
      setSavingFeeling(false);
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
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

  // ── Custom tooltip for feelings chart ──────────────────────────────────────
  const FeelingTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const f = FEELING_OPTIONS.find(o => o.value === payload[0].value);
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold">{payload[0].payload.date}</p>
        <p>{f?.emoji} {f?.label}</p>
      </div>
    );
  };

  const tabItems = [
    { id: 'stats',    icon: BarChart2, label: 'Stats' },
    { id: 'progress', icon: Dumbbell,  label: 'Progreso' },

    { id: 'profile',  icon: User,      label: 'Perfil' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-4 min-h-screen animate-fade-in">
      {/* Internal tab bar */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6 bg-white shadow-sm">
        {tabItems.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}>
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── STATS ── */}
      {activeTab === 'stats' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: '🥊', label: 'Total sesiones', value: totalSessions },
              { icon: '📅', label: 'Este mes',        value: thisMonthCount },
              { icon: '⚡', label: 'Próxima sesión',  value: nextSession ? `${nextSession.date} ${nextSession.time || ''}` : 'Sin agendar' },
              { icon: '🏷️', label: 'Plan',            value: getPlanName(user?.plan || 'free') },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-1 text-center">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-xs text-gray-500 font-medium">{card.label}</span>
                <span className="font-black text-gray-900 text-sm leading-tight break-words">{card.value}</span>
              </div>
            ))}
          </div>

          {/* Sessions by month chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-base font-black text-gray-900 mb-4">Sesiones por mes</h3>
            {sessionsByMonth.every(d => d.sesiones === 0) ? (
              <p className="text-gray-400 text-sm text-center py-8">Aún no tienes sesiones registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sessionsByMonth} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="sesiones" fill="#2563eb" radius={[4,4,0,0]}
                    isAnimationActive={true} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

            {/* ── FEELINGS ── */}
            {/* Sensaciones extraídas */}
      <>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 h-fit">
            <h3 className="text-base font-black text-gray-900 mb-4">¿Cómo te sentiste hoy?</h3>
            <div className="flex justify-between gap-2 mb-4">
              {FEELING_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFeelingSelected(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                    feelingSelected === opt.value
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[10px] text-gray-500 font-bold hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
            <textarea
              value={feelingText}
              onChange={e => setFeelingText(e.target.value)}
              placeholder="Comentario opcional sobre tu sesión..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
            />
            <div className="flex gap-3 items-center justify-end">
              {/* Date removed */}
              <button onClick={handleSaveFeeling} disabled={feelingSelected === null || savingFeeling}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">
                {savingFeeling ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          <div>
          {/* Feelings chart */}
          {feelingsChartData.length > 1 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-black text-gray-900 mb-4">Tendencia de ánimo</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={feelingsChartData} margin={{ top: 5, right: 5, bottom: 5, left: -30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 14 }} axisLine={false} tickLine={false}
                    tickFormatter={v => FEELING_OPTIONS.find(o => o.value === v)?.emoji || ''} />
                  <Tooltip content={<FeelingTooltip />} cursor={{ stroke: '#f0f0f0', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="estado" stroke="#eab308" strokeWidth={3}
                    dot={{ r: 5, fill: '#eab308', strokeWidth: 0 }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={true} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Feelings history list */}
          {feelings.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-black text-gray-900 mb-4">Historial</h3>
              <div className="space-y-3">
                {feelings.slice(0, 5).map(f => (
                  <div key={f.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl shrink-0 border border-gray-100">
                      {f.emoji}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-0.5">{f.date}</p>
                      {f.text && <p className="text-sm font-medium text-gray-800">{f.text}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </>



      {/* ── PROGRESS ── */}
      {activeTab === 'progress' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-base font-black text-gray-900">Progresión de carga</h3>
            <div className="flex items-center gap-2">
                {uniqueExercises.length > 0 && (
                  <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
                    {uniqueExercises.map(ex => (
                      <option key={ex as string} value={ex as string}>{ex as string}</option>
                    ))}
                  </select>
                )}
                <button onClick={exportToCSV} className="flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors" title="Descargar CSV">
                    <Download size={18} />
                </button>
            </div>
          </div>
          {filteredMetrics.length < 2 ? (
            <p className="text-gray-400 text-sm text-center py-12">
              {metrics.length === 0
                ? 'Tu entrenador aún no ha registrado datos de rendimiento.'
                : 'Se necesitan al menos 2 registros para mostrar la progresión.'}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredMetrics} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} unit=" kg" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value} kg`, 'Carga']}
                />
                <Area type="monotone" dataKey="load" name="Carga" stroke="#2563eb" strokeWidth={3} fill="url(#colorLoad)"
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={true} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Metrics table */}
          {metrics.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Fecha', 'Ejercicio', 'Carga', 'Reps', 'RPE'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs text-gray-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10).map((m: any) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-600 text-xs">{m.date}</td>
                      <td className="py-2 px-2 font-medium">{m.exercise}</td>
                      <td className="py-2 px-2">{m.load} kg</td>
                      <td className="py-2 px-2">{m.reps}</td>
                      <td className="py-2 px-2 text-gray-500">{m.rpe || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Editar Perfil</h2>

          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24 mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center">
                {photoURL ? (
                  <img src={photoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-blue-600">
                    {editName?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
                <Camera size={14} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handlePhotoUpload} />
            </div>
            {uploading && (
              <div className="w-full max-w-xs mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1 font-bold">
                  <span>Subiendo foto...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre o apodo *</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} maxLength={30} placeholder="¿Cómo quieres que te llamemos?" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
            </div>
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    Email de contacto
  </label>
  <input
    type="email"
    value={editContactEmail}
    onChange={e => setEditContactEmail(e.target.value)}
    placeholder="tucorreo@ejemplo.com"
    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
  />
  <p className="text-xs text-gray-400 mt-1">Opcional. Puede diferir del correo de acceso.</p>
</div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
              <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+56 9 xxxx xxxx" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de nacimiento</label>
              <input type="date" value={editBirthdate} onChange={e => setEditBirthdate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-gray-700" />
            </div>

            {/* Read-only fields */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-400 mb-1">Email</label>
              <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed" />
            </div>
            <div className="flex justify-between items-center py-2 bg-blue-50/50 px-4 rounded-xl border border-blue-100">
              <span className="text-sm font-bold text-gray-600">Plan activo</span>
              <span className="font-black text-blue-700 text-sm uppercase tracking-wide">{getPlanName(user?.plan || 'free')}</span>
            </div>
          </div>

          <button onClick={handleSaveProfile} disabled={saving || uploading}
            className="w-full mt-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 transition-colors shadow-lg">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saveMsg && (
            <p className={`text-center text-sm mt-3 font-bold ${saveMsg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientStatsView;
