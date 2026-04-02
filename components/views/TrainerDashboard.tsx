import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Users, Calendar, LogOut, ChevronDown, Info, MessageCircle, CreditCard, CheckCircle, BookOpen } from 'lucide-react';
import AgendaSection from './AgendaSection';
import CommunitySection from './CommunitySection';
import ClientProfileView from './ClientProfileView';
import TrainerLibraryManager from './TrainerLibraryManager';
import AttendanceView from './AttendanceView';
import TrainerPlansManager from './TrainerPlansManager';
import { getPlanName } from '../../utils/plans';
import { useModal } from "../../contexts/ModalContext";

const TrainerDashboard = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const { showAlert, showConfirm } = useModal();
  const [currentTab, setCurrentTab] = useState<'clients' | 'agenda' | 'community' | 'payments' | 'biblioteca' | 'asistencia' | 'planes'>('clients');
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
  const pendingPayments = clients.filter(c => c.paymentStatus === 'pending_verification');

  const approvePayment = async (clientId: string) => {
    try {
        await updateDoc(doc(db, 'users', clientId), { paymentStatus: null });
        showAlert('Pago verificado. El plan del atleta ha sido activado definitivamente.');
    } catch(e) { console.error(e); }
  };

  const archiveClient = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'users', clientId), { status: 'archived', archivedAt: Timestamp.now() });
    } catch(e) { console.error(e); }
  };

  const restoreClient = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'users', clientId), { status: 'active', archivedAt: null });
    } catch(e) { console.error(e); }
  };

  const deleteClient = async (clientId: string) => {
    showConfirm('¿Eliminar cliente permanentemente?', 'Esta acción no se puede deshacer.', async () => {
      try { await deleteDoc(doc(db, 'users', clientId)); } catch(e) { console.error(e); }
    });
  };

  if (selectedClient) {
    return <ClientProfileView client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  const tabs = [
    { id: 'clients',     label: 'Clientes',    imgSrc: '/custom-icons/nav_clients.png' },
    { id: 'agenda',      label: 'Agenda',       imgSrc: '/custom-icons/nav_calendar.png' },
    { id: 'asistencia',  label: 'Asistencia',   imgSrc: '/custom-icons/nav_achievements.png' },
    { id: 'community',   label: 'Comunidad',    imgSrc: '/custom-icons/nav_community.png' },
    { id: 'planes',      label: 'Planes',       imgSrc: '/custom-icons/nav_plan.png' },
    { id: 'payments',    label: 'Pagos',        imgSrc: '/custom-icons/nav_payments.png' },
    { id: 'biblioteca',  label: 'Biblioteca',   imgSrc: '/custom-icons/nav_library.png' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-10 shadow-lg shadow-black/20">

        {/* Row 1 */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-header.png" alt="TommyBox" className="h-9 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-400 hidden sm:block">{user?.displayName}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Row 2 — Tabs */}
        <div className="bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto px-2 sm:px-4 flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`flex flex-col sm:flex-row items-center justify-center sm:gap-2 py-3 px-2 sm:px-5 font-bold text-[10px] sm:text-sm transition-all border-b-2 flex-1 sm:flex-none whitespace-nowrap ${
                  currentTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                  <img src={tab.imgSrc} alt={tab.label} className="w-6 h-6 mb-1 sm:mb-0 opacity-90" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in">

        {currentTab === 'agenda'      && <AgendaSection user={user} />}
        {currentTab === 'community'   && <CommunitySection user={user} />}
        {currentTab === 'biblioteca'  && <TrainerLibraryManager user={user} />}
        {currentTab === 'asistencia'  && <AttendanceView user={user} />}
        {currentTab === 'planes'      && <TrainerPlansManager user={user} />}

        {/* ── Payments ── */}
        {currentTab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Verificar Transferencias ({pendingPayments.length})
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Confirma manualmente las transferencias de tus atletas para dejar sus planes listos.
              </p>
            </div>
            {pendingPayments.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                No tienes transferencias pendientes por verificar.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingPayments.map(client => (
                  <div key={client.id} className="p-6 hover:bg-gray-50 flex items-center justify-between gap-4 flex-wrap transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{client.displayName}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between">
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                        Plan: {getPlanName(client.plan)}
                      </span>
                      <button
                        onClick={() => approvePayment(client.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={18} /> Aprobar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Clients ── */}
        {currentTab === 'clients' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">
                Clientes Activos <span className="text-gray-400 font-medium text-lg">({activeClients.length})</span>
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                {activeClients.map(client => (
                  <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {client.photoURL ? (
                        <img src={client.photoURL} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-blue-600 text-lg">
                          {client.displayName?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{client.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      {client.createdAt?.toDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Miembro desde {client.createdAt.toDate().toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>

                    {/* Plan badge */}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold whitespace-nowrap hidden sm:block">
                      {client.plan ? getPlanName(client.plan) : 'Sin plan'}
                    </span>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Ver →
                      </button>
                      <button
                        onClick={() => archiveClient(client.id)}
                        className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors hidden sm:block"
                      >
                        Archivar
                      </button>
                    </div>
                  </div>
                ))}
                {activeClients.length === 0 && (
                  <div className="p-12 text-center text-gray-500">No hay clientes activos.</div>
                )}
              </div>
            </div>

            {/* Archived toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <ChevronDown size={16} className={showArchived ? 'rotate-180 transition-transform' : 'transition-transform'} />
              Archivados ({archivedClients.length})
            </button>

            {showArchived && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Info size={12} /> Los clientes archivados se eliminan automáticamente después de 60 días.
                </p>
                {archivedClients.map(client => (
                  <div key={client.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 opacity-70">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="font-black text-gray-400 text-lg">
                        {client.displayName?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-600 truncate">{client.displayName}</p>
                      <p className="text-xs text-gray-400">
                        Archivado: {client.archivedAt?.toDate?.().toLocaleDateString('es-CL') || '—'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => restoreClient(client.id)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-200 transition-colors"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="px-3 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-200 transition-colors"
                      >
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
