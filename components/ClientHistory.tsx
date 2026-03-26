
import React, { useState, useEffect, useMemo } from 'react';
import { Metric, Observation, Feeling, Session } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, List, TrendingUp, Gauge } from 'lucide-react';
import { subscribeToUserMetrics, subscribeToUserObservations, subscribeToUserFeelings, subscribeToUserSessions } from '../services/db';

interface ClientHistoryProps {
  selectedClient: string | null;
  updateTrigger: string;
}

const ClientHistory: React.FC<ClientHistoryProps> = ({ selectedClient, updateTrigger }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [feelings, setFeelings] = useState<Feeling[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // View state for metrics
  const [metricsView, setMetricsView] = useState<'list' | 'chart'>('list');
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  // Helper function to safely get milliseconds from timestamp objects that might be malformed
  const getTime = (t: any) => {
    if (!t) return 0;
    if (typeof t.toMillis === 'function') return t.toMillis();
    if (typeof t.toDate === 'function') return t.toDate().getTime();
    return 0;
  };

  useEffect(() => {
    if (!selectedClient) {
      setMetrics([]);
      setObservations([]);
      setFeelings([]);
      setSessions([]);
      return;
    }

    const unsubscribeMetrics = subscribeToUserMetrics(selectedClient, (data) => {
      const sortedMetrics = [...data].sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
      setMetrics(sortedMetrics);
      if (sortedMetrics.length > 0 && !selectedExercise) {
          setSelectedExercise(sortedMetrics[0].exercise);
      }
    });

    const unsubscribeObservations = subscribeToUserObservations(selectedClient, (data) => {
      setObservations([...data].sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp)));
    });

    const unsubscribeFeelings = subscribeToUserFeelings(selectedClient, (data) => {
      setFeelings([...data].sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp)));
    });

    const unsubscribeSessions = subscribeToUserSessions(selectedClient, (data) => {
      setSessions([...data]
        .filter(s => new Date(s.date + 'T00:00:00') >= new Date(new Date().toDateString())) // only future sessions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeObservations();
      unsubscribeFeelings();
      unsubscribeSessions();
    };
  }, [selectedClient, updateTrigger]);

  // Derived data for charts
  const uniqueExercises = useMemo(() => {
      const exercises = new Set(metrics.map(m => m.exercise));
      return Array.from(exercises);
  }, [metrics]);

  const chartData = useMemo(() => {
      if (!selectedExercise) return [];
      // Filter by exercise and sort Oldest -> Newest for chart
      return metrics
        .filter(m => m.exercise === selectedExercise)
        .sort((a, b) => getTime(a.timestamp) - getTime(b.timestamp))
        .map(m => ({
            date: new Date(m.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
            load: m.load,
            reps: m.reps,
            rpe: m.rpe,
            fullDate: m.date
        }));
  }, [metrics, selectedExercise]);

  return (
    <div>
      {!selectedClient ? (
        <div className="h-full flex items-center justify-center p-4">
          <p className="text-gray-500 text-center">Selecciona un cliente para ver el historial.</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          
          {/* Sessions Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                Agendamiento
            </h4>
            {sessions.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-600">
                {sessions.map((s) => (
                    <li key={s.id} className="bg-white p-2 rounded-lg border border-gray-100 flex justify-between items-center">
                        <span className="font-semibold text-blue-600">{new Date(s.date).toLocaleDateString('es-ES', { timeZone: 'UTC', weekday: 'short', day: 'numeric' })}</span>
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{s.time}</span>
                    </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 text-sm italic">No hay sesiones próximas agendadas.</p>}
          </div>

          {/* Metrics Section */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                    Métricas de Fuerza
                </h4>
                {metrics.length > 0 && (
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setMetricsView('list')}
                            className={`p-1.5 rounded-md transition-all ${metricsView === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Ver Lista"
                        >
                            <List size={16} />
                        </button>
                        <button 
                            onClick={() => setMetricsView('chart')}
                            className={`p-1.5 rounded-md transition-all ${metricsView === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Ver Gráfico"
                        >
                            <BarChart2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {metrics.length > 0 ? (
              <>
                  {metricsView === 'list' ? (
                    <ul className="space-y-2 text-sm text-gray-600">
                        {metrics.map((m) => (
                            <li key={m.id} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                <span className="font-bold text-gray-800">{m.exercise}</span>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                         {m.rpe && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="RPE (Esfuerzo Percibido)">
                                                <Gauge size={10} /> {m.rpe}
                                            </span>
                                         )}
                                         <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{m.load}kg x {m.reps}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-0.5">{new Date(m.date).toLocaleDateString('es-ES', {month:'numeric', day:'numeric'})}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="animate-fade-in">
                        <div className="mb-4">
                            <select 
                                value={selectedExercise} 
                                onChange={(e) => setSelectedExercise(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                {uniqueExercises.map(ex => (
                                    <option key={ex} value={ex}>{ex}</option>
                                ))}
                            </select>
                        </div>
                        
                        {chartData.length > 0 ? (
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 10, fill: '#9ca3af'}} 
                                            dy={5} 
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 10, fill: '#9ca3af'}} 
                                            domain={['dataMin - 5', 'dataMax + 5']}
                                        />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px'}}
                                            formatter={(value: any, name: any, props: any) => {
                                                if (name === 'rpe') return [`${value}/10`, 'RPE'];
                                                return [`${value} kg`, `Carga`];
                                            }}
                                            labelFormatter={(label) => label}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="load" 
                                            stroke="#2563eb" 
                                            strokeWidth={3} 
                                            dot={{fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff'}}
                                            activeDot={{ r: 6 }} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                {chartData.length < 2 && (
                                    <p className="text-center text-xs text-gray-400 mt-2 italic">Se necesitan más datos para mostrar tendencia.</p>
                                )}
                            </div>
                        ) : (
                             <p className="text-center text-gray-400 text-sm py-8">Selecciona un ejercicio para ver el progreso</p>
                        )}
                    </div>
                  )}
              </>
            ) : <p className="text-gray-500 text-sm italic py-4 text-center">No hay métricas registradas.</p>}
          </div>
          
          {/* Evaluations Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                Evaluaciones Técnicas
            </h4>
            {observations.length > 0 ? (
              <ul className="space-y-3 text-sm text-gray-600">
                {observations.map((o) => (
                    <li key={o.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <p className="italic text-gray-700 mb-1">"{o.comment}"</p>
                        <p className="text-[10px] text-gray-400 text-right font-bold uppercase">{o.date}</p>
                    </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 text-sm italic">No hay evaluaciones registradas.</p>}
          </div>

          {/* Feelings Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                Sensaciones del Atleta
            </h4>
            {feelings.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-600">
                {feelings.map((f) => (
                    <li key={f.id} className="bg-white p-3 rounded-lg border border-gray-100 flex gap-3 items-start">
                        <div className="p-1.5 bg-yellow-50 rounded-full text-yellow-600 shrink-0">
                            <TrendingUp size={14} />
                        </div>
                        <div>
                            <p className="text-gray-800 font-medium">{f.feeling}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{f.date}</p>
                        </div>
                    </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 text-sm italic">No hay sensaciones registradas.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientHistory;
