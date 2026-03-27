import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Users, Calendar, LogOut, ChevronRight, Info } from 'lucide-react';
import AgendaSection from './AgendaSection';
import ClientProfileView from './ClientProfileView';

const TrainerDashboard = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'agenda'>('clients');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setClients(allUsers.filter(u => !(u as any).isTrainer));
    });
    return () => unsubscribe();
  }, []);

  const activeClients = clients.filter(c => c.status !== 'archived');
  const archivedClients = clients.filter(c => c.status === 'archived');

  const archiveClient = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'users', clientId), {
        status: 'archived',
        archivedAt: Timestamp.now()
      });
    } catch(e) { console.error(e); }
  };

  const restoreClient = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'users', clientId), {
        status: 'active',
        archivedAt: null
      });
    } catch(e) { console.error(e); }
  };

  const deleteClient = async (clientId: string) => {
    if (!confirm('¿Eliminar cliente permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'users', clientId));
    } catch(e) { console.error(e); }
  };

  if (selectedClient) {
      return <ClientProfileView client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png" alt="TommyBox" className="h-8 object-contain" />
            <span className="font-black text-xl tracking-tight hidden sm:block">TOMMYBOX TRAINER</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">{user?.displayName}</span>
            <button onClick={onLogout} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
              <LogOut size={20} />
              <span className="text-sm font-medium hidden md:block">Salir</span>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100">
            <div className="container mx-auto px-4 flex">
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex items-center gap-2 py-3 px-5 font-medium text-sm transition-colors border-b-2 -mb-px ${
                        activeTab === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Users size={16} /><span>Clientes</span>
                </button>
                <button
                    onClick={() => setActiveTab('agenda')}
                    className={`flex items-center gap-2 py-3 px-5 font-medium text-sm transition-colors border-b-2 -mb-px ${
                        activeTab === 'agenda' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Calendar size={16} /><span>Agenda</span>
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
        {activeTab === 'agenda' && <AgendaSection user={user} />}

        {activeTab === 'clients' && (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-4">Clientes Activos ({activeClients.length})</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                        {activeClients.map(c => (
                            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {c.displayName?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{c.displayName}</p>
                                        <p className="text-xs text-gray-500">{c.email}</p>
                                    </div>
                                    {c.plan && (
                                        <span className="hidden sm:inline-block ml-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                                            {c.plan}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => archiveClient(c.id)} className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors hidden sm:block">
                                        Archivar
                                    </button>
                                    <button onClick={() => setSelectedClient(c)} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                                        Ver perfil <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {activeClients.length === 0 && <div className="p-8 text-center text-gray-500">No hay clientes activos.</div>}
                    </div>
                </div>

                {archivedClients.length > 0 && (
                    <div className="pt-8 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-bold text-gray-700">Archivados ({archivedClients.length})</h2>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                            <Info size={14} /> Los clientes archivados se eliminan automáticamente después de 60 días.
                        </p>

                        <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-200 overflow-hidden">
                            {archivedClients.map(c => (
                                <div key={c.id} className="p-4 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-lg">
                                            {c.displayName?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700">{c.displayName}</p>
                                            <p className="text-xs text-gray-500">{c.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 mr-2 hidden md:inline-block">
                                            Archivado: {c.archivedAt?.toDate ? c.archivedAt.toDate().toLocaleDateString('es-CL') : 'Reciente'}
                                        </span>
                                        <button onClick={() => restoreClient(c.id)} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                            Restaurar
                                        </button>
                                        <button onClick={() => deleteClient(c.id)} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default TrainerDashboard;
