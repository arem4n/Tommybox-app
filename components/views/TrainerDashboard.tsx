import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Users, Calendar, LogOut, ChevronDown, Info } from 'lucide-react';
import AgendaSection from './AgendaSection';
import ClientProfileView from './ClientProfileView';

import { useModal } from "../../contexts/ModalContext";

const TrainerDashboard = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const { showAlert, showConfirm } = useModal();
  const [currentTab, setCurrentTab] = useState<'clients' | 'agenda'>('clients');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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
    if (!showConfirm('¿Eliminar cliente permanentemente? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'users', clientId));
    } catch(e) { console.error(e); }
  };

  if (selectedClient) {
      return <ClientProfileView client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  const tabs = [
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        {/* Row 1 */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png" alt="TommyBox" className="h-8 object-contain" />
            <span className="font-black text-xl lg:text-2xl lg:text-3xl lg:text-4xl tracking-tight hidden sm:block">TOMMYBOX TRAINER</span>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 lg:p-6 lg:p-8">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">{user?.displayName}</span>
            <button onClick={onLogout} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
              <LogOut size={20} />
              <span className="text-sm font-medium hidden md:block">Salir</span>
            </button>
          </div>
        </div>

        {/* Row 2 — Tabs */}
        <div className="border-t border-gray-100">
            <div className="container mx-auto px-4 flex">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-5 font-medium text-sm transition-colors border-b-2 -mb-px ${
                        currentTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <tab.icon size={16} /><span>{tab.label}</span>
                </button>
            ))}
            </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
        {currentTab === 'agenda' && <AgendaSection user={user} />}

        {currentTab === 'clients' && (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl lg:text-3xl lg:text-4xl font-black text-gray-900 mb-4 lg:mb-6 lg:mb-8">Clientes Activos ({activeClients.length})</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                        {activeClients.map(client => (
                          <div key={client.id} className="flex items-center gap-4 lg:gap-6 lg:p-6 lg:p-8 p-4 lg:p-6 lg:p-8 hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                              {client.photoURL ? (
                                <img src={client.photoURL} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-black text-blue-600 text-xl lg:text-2xl lg:text-3xl lg:text-4xl">{client.displayName?.[0]?.toUpperCase() || '?'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">{client.displayName}</p>
                              <p className="text-xs text-gray-500 truncate">{client.email}</p>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold whitespace-nowrap hidden sm:block">
                              {client.plan || 'Sin plan'}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedClient(client)}
                                className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                                Ver →
                              </button>
                              <button onClick={() => archiveClient(client.id)}
                                className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 hidden sm:block">
                                Archivar
                              </button>
                            </div>
                          </div>
                        ))}
                        {activeClients.length === 0 && <div className="p-8 text-center text-gray-500">No hay clientes activos.</div>}
                    </div>
                </div>

                <button onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-6 mb-3">
                  <ChevronDown size={16} className={showArchived ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  Archivados ({archivedClients.length})
                </button>

                {showArchived && (
                  <div>
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <Info size={12} /> Los clientes archivados se eliminan automáticamente después de 60 días.
                    </p>
                    {archivedClients.map(client => (
                      <div key={client.id} className="flex items-center gap-4 lg:gap-6 lg:p-6 lg:p-8 p-4 lg:p-6 lg:p-8 bg-gray-50 rounded-2xl border border-gray-200 mb-3 opacity-70">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="font-black text-gray-400 text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl">{client.displayName?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-600 truncate">{client.displayName}</p>
                          <p className="text-xs text-gray-400">
                            Archivado: {client.archivedAt?.toDate?.().toLocaleDateString('es-CL') || '—'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => restoreClient(client.id)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-200">
                            Restaurar
                          </button>
                          <button onClick={() => deleteClient(client.id)}
                            className="px-3 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-200">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default TrainerDashboard;
