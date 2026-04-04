import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { collectionGroup, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, BarChart2, Calendar } from 'lucide-react';
import { AppUser } from '../../types';

interface SessionEvent {
  date: string;
  time: string;
  attended?: boolean;
  userId: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const isoWeek = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const wn = Math.round(((d.getTime() - week1.getTime()) / 86400000 + ((week1.getDay() + 6) % 7)) / 7) + 1;
  return `${d.getFullYear()}-S${String(wn).padStart(2, '0')}`;
};

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// ── Sub-components ──────────────────────────────────────────────────────────────

const StatCard = ({
  iconSrc,
  label,
  value,
  sub,
  color,
}: {
  iconSrc: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-4">
    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <img src={iconSrc} alt={label} className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-sm" />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Weekly Attendance Chart ─────────────────────────────────────────────────────

const WeeklyAttendanceChart = ({ sessions }: { sessions: SessionEvent[] }) => {
  const data = useMemo(() => {
    const today = new Date();
    const weeks: { week: string; agendadas: number; asistidas: number }[] = [];

    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      const wk = isoWeek(d);
      weeks.push({ week: wk.replace(/\d{4}-/, ''), agendadas: 0, asistidas: 0 });
    }

    const weekKeys = weeks.map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (7 - i) * 7);
      return isoWeek(d);
    });

    sessions.forEach((s) => {
      if (!s.date) return;
      const wk = isoWeek(new Date(s.date + 'T12:00:00'));
      const idx = weekKeys.indexOf(wk);
      if (idx === -1) return;
      weeks[idx].agendadas++;
      if (s.attended) weeks[idx].asistidas++;
    });

    return weeks;
  }, [sessions]);

  const totalAgendadas = data.reduce((sum, w) => sum + w.agendadas, 0);
  const totalAsistidas = data.reduce((sum, w) => sum + w.asistidas, 0);
  const attendanceRate = totalAgendadas > 0 ? Math.round((totalAsistidas / totalAgendadas) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-gray-900">Asistencia semanal</h3>
          <p className="text-sm text-gray-500 mt-0.5">Últimas 8 semanas</p>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-black ${attendanceRate >= 75 ? 'text-green-600' : attendanceRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
            {attendanceRate}%
          </span>
          <p className="text-xs text-gray-400">tasa global</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={2}>
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
            labelStyle={{ fontWeight: 700, color: '#111827' }}
          />
          <Bar dataKey="agendadas" name="Agendadas" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
          <Bar dataKey="asistidas" name="Asistidas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-5 mt-4 text-xs font-semibold text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /> Agendadas</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Asistidas</span>
      </div>
    </div>
  );
};

// ── Monthly Retention Table ────────────────────────────────────────────────────

const MonthlyRetentionTable = ({ clients }: { clients: AppUser[] }) => {
  const rows = useMemo(() => {
    const cohorts: Record<string, { total: number; retained: number }> = {};

    clients.forEach((c) => {
      // Handle both Firestore Timestamp and plain ISO string
      let joinDate: Date | null = null;
      if (c.firstSessionDate && typeof (c.firstSessionDate as any).toDate === 'function') {
        joinDate = (c.firstSessionDate as any).toDate();
      } else if (typeof c.firstSessionDate === 'string') {
        joinDate = new Date(c.firstSessionDate);
      }
      if (!joinDate || isNaN(joinDate.getTime())) return;

      const joinMonth = monthKey(joinDate);
      if (!cohorts[joinMonth]) cohorts[joinMonth] = { total: 0, retained: 0 };
      cohorts[joinMonth].total++;
      if (c.status !== 'archived') cohorts[joinMonth].retained++;
    });

    return Object.entries(cohorts)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([month, { total, retained }]) => ({
        month,
        total,
        retained,
        rate: total > 0 ? Math.round((retained / total) * 100) : 0,
      }));
  }, [clients]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-black text-gray-900 mb-1">Retención mensual</h3>
      <p className="text-sm text-gray-500 mb-5">% de clientes que siguen activos, agrupados por el mes en que hicieron su primera sesión</p>
      {rows.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-400 text-sm font-medium">Sin datos todavía</p>
          <p className="text-gray-400 text-xs mt-1">
            Aparecerá aquí cuando los clientes confirmen su primera sesión.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.month} className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-600 w-16 flex-shrink-0 capitalize">
                {monthLabel(row.month)}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    row.rate >= 75 ? 'bg-green-500' : row.rate >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${row.rate}%` }}
                />
              </div>
              <div className="text-right w-24 flex-shrink-0">
                <span className={`text-sm font-black ${row.rate >= 75 ? 'text-green-600' : row.rate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {row.rate}%
                </span>
                <span className="text-xs text-gray-400 ml-1">({row.retained}/{row.total})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Popular Plans ──────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  plan_1: '#3b82f6',
  plan_2: '#8b5cf6',
  plan_3: '#f97316',
};

const PopularPlansChart = ({ clients }: { clients: AppUser[] }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    clients
      .filter((c) => c.status !== 'archived' && c.plan && c.plan !== 'free' && c.plan !== 'Sin Plan')
      .forEach((c) => {
        counts[c.plan!] = (counts[c.plan!] || 0) + 1;
      });

    const PLAN_NAMES: Record<string, string> = {
      plan_1: 'Esencial',
      plan_2: 'Avanzado',
      plan_3: 'Elite',
    };

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([id, count]) => ({
        name: PLAN_NAMES[id] ?? id,
        count,
        id,
        color: PLAN_COLORS[id] ?? '#6b7280',
      }));
  }, [clients]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-black text-gray-900 mb-1">Planes más populares</h3>
      <p className="text-sm text-gray-500 mb-5">Distribución entre clientes activos con plan</p>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm py-6 text-center">No hay clientes con plan asignado.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
                formatter={(v: number) => [`${v} cliente${v !== 1 ? 's' : ''}`, '']}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4">
            {data.map((d) => (
              <div key={d.id} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
                {d.name} — {total > 0 ? Math.round((d.count / total) * 100) : 0}%
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const TrainerAnalyticsDashboard = ({ clients }: { clients: AppUser[] }) => {
  const [sessions, setSessions] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 65-day cutoff — enough for 8-week chart + some buffer; avoids unbounded collectionGroup reads
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 65);
    return d.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    const q = collectionGroup(db, 'events');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const evts: SessionEvent[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          const parentPath = d.ref.parent.path;
          const match = parentPath.match(/agenda\/([^/]+)\/events/);
          return {
            date: data.date,
            time: data.time,
            attended: data.attended ?? false,
            userId: match ? match[1] : '',
          };
        })
        .filter((e) => e.date >= cutoff); // enforce date window in-memory
      setSessions(evts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [cutoff]);

  const activeClients = clients.filter((c) => c.status !== 'archived');
  const withPlan = activeClients.filter((c) => c.plan && c.plan !== 'free' && c.plan !== 'Sin Plan');
  const withFirstSession = clients.filter((c) => c.firstSessionDate?.toDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 font-medium">
        Cargando analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard iconSrc="/custom-icons/cliente_activo.png" label="Clientes activos" value={activeClients.length} color="bg-blue-50/50" />
        <StatCard iconSrc="/custom-icons/plan_activo.png" label="Con plan activo" value={withPlan.length} sub={`${activeClients.length > 0 ? Math.round((withPlan.length / activeClients.length) * 100) : 0}% del total`} color="bg-blue-50/50" />
        <StatCard iconSrc="/custom-icons/sesiones_totales.png" label="Sesiones totales" value={sessions.length} sub={`${sessions.filter((s) => s.attended).length} confirmadas`} color="bg-slate-50/50" />
        <StatCard iconSrc="/custom-icons/seguimiento_primera_sesion.png" label="Con seguimiento completo" value={withFirstSession.length} sub="rastreados desde su 1ª sesión" color="bg-slate-50/50" />
      </div>

      {/* Charts */}
      <WeeklyAttendanceChart sessions={sessions} />

      <div className="grid lg:grid-cols-2 gap-6">
        <MonthlyRetentionTable clients={clients} />
        <PopularPlansChart clients={clients} />
      </div>
    </div>
  );
};

export default TrainerAnalyticsDashboard;
