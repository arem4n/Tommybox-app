import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import { ChevronLeft, Download, Upload, Activity, FileText } from 'lucide-react';

const ClientProfileView = ({ client, onBack }: { client: any, onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'Rendimiento' | 'Observaciones'>('Rendimiento');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);

  // Metric Form State
  const [metricExercise, setMetricExercise] = useState('');
  const [metricLoad, setMetricLoad] = useState('');
  const [metricReps, setMetricReps] = useState('');
  const [metricRPE, setMetricRPE] = useState('');
  const [metricDate, setMetricDate] = useState(new Date().toISOString().split('T')[0]);

  // Observation Form State
  const [obsComment, setObsComment] = useState('');
  const [obsDate, setObsDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!client?.id) return;

    const qM = query(collection(db, `users/${client.id}/metrics`), orderBy('date', 'desc'));
    const unsubM = onSnapshot(qM, (snapshot) => {
      setMetrics(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qO = query(collection(db, `users/${client.id}/observations`), orderBy('date', 'desc'));
    const unsubO = onSnapshot(qO, (snapshot) => {
      setObservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubM(); unsubO(); };
  }, [client?.id]);

  const exportToCSV = async (clientId: string) => {
    try {
        const snap = await getDocs(collection(db, `users/${clientId}/metrics`));
        const metricsData = snap.docs.map(d => d.data());
        const header = 'Fecha,Ejercicio,Carga (kg),Reps,RPE\n';
        const rows = metricsData.map(m => `${m.date},${m.exercise},${m.load},${m.reps},${m.rpe || ''}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tommybox_${clientId}_metricas.csv`;
        a.click();
        URL.revokeObjectURL(url);
    } catch(e) {
        console.error("Error exporting CSV: ", e);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const lines = text.split('\n').slice(1); // skip header row
        let count = 0;
        for (const line of lines) {
            const [date, exercise, load, reps, rpe] = line.split(',').map(s => s.trim());
            if (!date || !exercise || !load || !reps) continue;
            await addDoc(collection(db, `users/${client.id}/metrics`), {
                date,
                exercise,
                load: parseFloat(load),
                reps: parseInt(reps),
                rpe: rpe ? parseInt(rpe) : undefined,
                timestamp: Timestamp.now()
            });
            count++;
        }
        alert(`Se importaron ${count} métricas correctamente.`);
    } catch(e) {
        console.error("Error importing CSV: ", e);
    }
    e.target.value = '';
  };

  const handleAddMetric = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!metricExercise || !metricLoad || !metricReps || !metricDate) return;
      try {
          await addDoc(collection(db, `users/${client.id}/metrics`), {
              exercise: metricExercise,
              load: parseFloat(metricLoad),
              reps: parseInt(metricReps),
              rpe: metricRPE ? parseInt(metricRPE) : null,
              date: metricDate,
              timestamp: Timestamp.now()
          });
          setMetricExercise('');
          setMetricLoad('');
          setMetricReps('');
          setMetricRPE('');
      } catch(e) { console.error(e); }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!obsComment || !obsDate) return;
      try {
          await addDoc(collection(db, `users/${client.id}/observations`), {
              comment: obsComment,
              date: obsDate,
              timestamp: Timestamp.now()
          });
          setObsComment('');
      } catch(e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-fade-in">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm p-4">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <button onClick={onBack} className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline">
                    ← Clientes
                  </button>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {client.photoURL ? (
                      <img src={client.photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-black text-blue-600">{client.displayName?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-black text-gray-900">{client.displayName}</h2>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{client.plan || 'Sin plan'}</span>
                  </div>
                  <button onClick={() => exportToCSV(client.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700">
                    <Download size={16} /> Exportar CSV
                  </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('Rendimiento')}
                        className={`flex items-center gap-2 py-3 px-5 font-bold text-sm rounded-t-xl transition-colors ${
                            activeTab === 'Rendimiento' ? 'bg-gray-50 text-blue-600 border-t-4 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Activity size={18} /><span>Rendimiento</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('Observaciones')}
                        className={`flex items-center gap-2 py-3 px-5 font-bold text-sm rounded-t-xl transition-colors ${
                            activeTab === 'Observaciones' ? 'bg-gray-50 text-blue-600 border-t-4 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <FileText size={18} /><span>Observaciones</span>
                    </button>
                </div>
            </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">

            {activeTab === 'Rendimiento' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Agregar Métrica</h3>
                            <label className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                              <Upload size={16} /> Importar CSV
                              <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
                            </label>
                        </div>
                        <form onSubmit={handleAddMetric} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <input type="date" value={metricDate} onChange={e => setMetricDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm" />
                            <input type="text" value={metricExercise} onChange={e => setMetricExercise(e.target.value)} placeholder="Ejercicio" required className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm" />
                            <input type="number" step="any" value={metricLoad} onChange={e => setMetricLoad(e.target.value)} placeholder="Carga (kg)" required className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm" />
                            <input type="number" value={metricReps} onChange={e => setMetricReps(e.target.value)} placeholder="Reps" required className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm" />
                            <div className="flex gap-2">
                                <input type="number" value={metricRPE} onChange={e => setMetricRPE(e.target.value)} placeholder="RPE 1-10" min="1" max="10" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm" />
                                <button type="submit" className="bg-blue-600 text-white font-bold rounded-lg px-4 hover:bg-blue-700 transition-colors">+</button>
                            </div>
                        </form>
                    </div>

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
                                <div className="p-12 text-center text-gray-500">Sin datos aún. Agrega la primera métrica.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Observaciones' && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Nueva Observación</h3>
                        <form onSubmit={handleAddObservation} className="flex flex-col gap-4">
                            <input type="date" value={obsDate} onChange={e => setObsDate(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm" />
                            <textarea value={obsComment} onChange={e => setObsComment(e.target.value)} placeholder="Ej: Molestia en rodilla derecha al bajar..." required rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20">
                                Guardar observación
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Historial</h3>
                        <div className="space-y-2">
                            {observations.map(obs => (
                              <div key={obs.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-blue-100 mt-1 shrink-0"></div>
                                  <div className="w-0.5 flex-1 bg-gray-200 mt-2 mb-2"></div>
                                </div>
                                <div className="pb-6 pt-0.5">
                                  <p className="text-xs text-gray-500 font-bold mb-1 tracking-wider uppercase">{obs.date}</p>
                                  <p className="text-gray-800 text-sm leading-relaxed">{obs.comment}</p>
                                </div>
                              </div>
                            ))}
                            {observations.length === 0 && (
                                <div className="text-gray-500 text-center py-8 text-sm">No hay observaciones registradas.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </main>
    </div>
  );
};

export default ClientProfileView;
