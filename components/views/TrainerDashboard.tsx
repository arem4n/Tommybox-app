import React, { useState, useEffect } from 'react';
import { AppUser } from '../../types';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Users, Calendar, LogOut, ChevronDown, Info, MessageCircle, CreditCard, CheckCircle, BookOpen, ArrowRight, CheckSquare, Layers, X } from 'lucide-react';
import { HamburgerIcon } from './HamburgerIcon';
import AgendaSection from './AgendaSection';
import CommunitySection from './CommunitySection';
import ClientProfileView from './ClientProfileView';
import TrainerLibraryManager from './TrainerLibraryManager';
import AttendanceView from './AttendanceView';
import TrainerPlansManager from './TrainerPlansManager';
import TrainerAnalyticsDashboard from './TrainerAnalyticsDashboard';
import TrainerProfileView from './TrainerProfileView';
import { getPlanName } from '../../utils/plans';
import { useModal } from "../../contexts/ModalContext";

type PrimaryTab = 'clients' | 'agenda' | 'asistencia';
type SecondaryTab = 'planes' | 'payments' | 'biblioteca' | 'community' | 'analytics' | 'perfil';
type CurrentTab = PrimaryTab | SecondaryTab;

const TrainerDashboard = ({ user, onLogout }: { user: AppUser, onLogout: () => void }) => {
  const { showAlert, showConfirm } = useModal();
  const [currentTab, setCurrentTab] = useState<CurrentTab>('clients');
  const [clients, setClients] = useState<AppUser[]>([]);
  const [selectedClient, setSelectedClient] = useState<AppUser | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [hasPlans, setHasPlans] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      setClients(allUsers.filter(u => !u.isTrainer));
    });
    return () => unsubscribe();
  }, []);

  // Check if trainer has configured plans
  useEffect(() => {
    const q = query(collection(db, 'plans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasPlans(snapshot.docs.length > 0);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const activeClients = clients.filter(c => c.status !== 'archived');
  const archivedClients = clients.filter(c => c.status === 'archived');
  const pendingPayments = clients.filter(c => c.paymentStatus === 'pending_verification');

  // Onboarding steps
  const profileComplete = !!(user?.displayName);
  const plansConfigured = hasPlans;
  const hasInvitedClient = activeClients.length > 0;
  const onboardingDone = profileComplete && plansConfigured && hasInvitedClient;

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

  const primaryTabs = [
    { id: 'clients',    label: 'Clientes',   imgSrc: '/custom-icons/nav_clients.png' },
    { id: 'agenda',     label: 'Agenda',      imgSrc: '/custom-icons/nav_calendar.png' },
    { id: 'asistencia', label: 'Asistencia',  imgSrc: '/custom-icons/nav_achievements.png' },
    { id: 'community',  label: 'Comunidad',   imgSrc: '/custom-icons/nav_community.png' },
  ];

  const secondaryTabs = [
    { id: 'planes',     label: 'Planes',      imgSrc: '/custom-icons/nav_plan.png' },
    { id: 'payments',   label: 'Pagos',       imgSrc: '/custom-icons/nav_payments.png', badge: pendingPayments.length },
    { id: 'biblioteca', label: 'Biblioteca',  imgSrc: '/custom-icons/nav_library.png' },
    { id: 'analytics',  label: 'Analytics',   imgSrc: '/custom-icons/nav_achievements.png' },
    { id: 'perfil',     label: 'Mi Perfil',   imgSrc: '/custom-icons/nav_profile.png' },
  ];

  const isPrimary = primaryTabs.some(t => t.id === currentTab);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 shadow-lg shadow-black/20">

        {/* Row 1 & 2 (Mobile Stacking) / Row 1 (Desktop) */}
        <div className="container mx-auto px-4 py-3 md:h-16 flex flex-col md:flex-row items-center justify-between relative">

          {/* Top section for Mobile: Logo Center, Logout Right */}
          <div className="flex items-center w-full justify-between md:hidden relative mb-3">
             <div className="flex-1 flex justify-center pl-8">
                 <img src="/logo-header.png" alt="TommyBox" className="h-8 object-contain" />
             </div>
             <div className="absolute right-0 top-0">
               <button
                  onClick={onLogout}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* Desktop Logo */}
          <div className="hidden md:flex items-center w-full justify-start md:pl-0">
            <img src="/logo-header.png" alt="TommyBox" className="h-9 object-contain" />
          </div>

          {/* Hamburger (Left on mobile, below logo visually) */}
          <div className="w-full flex justify-start md:hidden relative z-50">
            <HamburgerIcon isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          </div>

          {/* Desktop Logout/User */}
          <div className="hidden md:flex items-center gap-4 absolute right-4">
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

        {/* Desktop Navigation (>=768px) */}
        <div className="hidden md:block bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto">
            {/* First Row */}
            <div className="flex justify-start px-4 overflow-hidden">
              {primaryTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as CurrentTab)}
                  className={`flex items-center gap-2 py-3 px-5 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'border-blue-400 text-blue-400 bg-slate-800/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <img src={tab.imgSrc} alt={tab.label} className="w-6 h-6 md:w-7 md:h-7 opacity-90" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full flex items-center justify-center py-1 bg-slate-900/80">
                <div className="w-1/3 h-px bg-slate-800"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 text-slate-500">Gestión</span>
                <div className="w-1/3 h-px bg-slate-800"></div>
            </div>

            {/* Second Row */}
             <div className="flex justify-start px-4 overflow-hidden">
              {secondaryTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as CurrentTab)}
                  className={`relative flex items-center gap-2 py-3 px-5 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'border-slate-400 text-slate-200 bg-slate-800/50'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <img src={tab.imgSrc} alt={tab.label} className="w-5 h-5 md:w-6 md:h-6 opacity-70" />
                  <span>{tab.label}</span>
                  {(tab as any).badge > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {(tab as any).badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (<768px) */}
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-[75%] max-w-sm bg-slate-950 z-40 md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col pt-[100px] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {/* Primary Tabs */}
          {primaryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setCurrentTab(tab.id as CurrentTab); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-6 py-3.5 transition-colors ${
                currentTab === tab.id
                  ? 'bg-blue-900/30 text-blue-400 border-l-4 border-blue-400'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <img src={tab.imgSrc} alt={tab.label} className="w-7 h-7 opacity-90" />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="py-4 px-4 flex items-center justify-center">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 text-slate-500">Gestión</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {/* Secondary Tabs */}
          {secondaryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setCurrentTab(tab.id as CurrentTab); setIsMobileMenuOpen(false); }}
              className={`relative w-full flex items-center gap-3 px-6 py-3.5 transition-colors ${
                currentTab === tab.id
                  ? 'bg-slate-800/50 text-slate-200 border-l-4 border-slate-400'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              <img src={tab.imgSrc} alt={tab.label} className="w-5 h-5 md:w-6 md:h-6 opacity-70" />
              <span className="font-bold text-sm">{tab.label}</span>
              {(tab as any).badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {(tab as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Onboarding Banner ── */}
      {!onboardingDone && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-4 shadow-md">
          <div className="container mx-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-wider text-blue-200 mb-3">🚀 Primeros pasos como entrenador</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

              {/* Step 1 */}
              <button
                onClick={() => setCurrentTab('perfil')}
                className={`flex items-center gap-3 flex-1 rounded-xl px-4 py-3 transition-all ${
                  profileComplete
                    ? 'bg-white/20 opacity-60'
                    : 'bg-white/10 hover:bg-white/20 border border-white/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm ${profileComplete ? 'bg-green-400 text-white' : 'bg-white/20 text-white'}`}>
                  {profileComplete ? <CheckSquare size={16} /> : '1'}
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black ${profileComplete ? 'line-through opacity-60' : ''}`}>Completa tu perfil</p>
                  <p className="text-[10px] text-blue-200 hidden sm:block">Foto y nombre visible para atletas</p>
                </div>
              </button>

              <ArrowRight size={16} className="text-blue-300 hidden sm:block flex-shrink-0" />

              {/* Step 2 */}
              <button
                onClick={() => setCurrentTab('planes')}
                className={`flex items-center gap-3 flex-1 rounded-xl px-4 py-3 transition-all ${
                  plansConfigured
                    ? 'bg-white/20 opacity-60'
                    : !profileComplete
                      ? 'opacity-40 cursor-not-allowed bg-white/5 border border-white/10'
                      : 'bg-white/10 hover:bg-white/20 border border-white/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm ${plansConfigured ? 'bg-green-400 text-white' : 'bg-white/20 text-white'}`}>
                  {plansConfigured ? <CheckSquare size={16} /> : '2'}
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black ${plansConfigured ? 'line-through opacity-60' : ''}`}>Configura tus planes</p>
                  <p className="text-[10px] text-blue-200 hidden sm:block">Define precios y frecuencias</p>
                </div>
              </button>

              <ArrowRight size={16} className="text-blue-300 hidden sm:block flex-shrink-0" />

              {/* Step 3 */}
              <div
                className={`flex items-center gap-3 flex-1 rounded-xl px-4 py-3 transition-all ${
                  hasInvitedClient
                    ? 'bg-white/20 opacity-60'
                    : !plansConfigured
                      ? 'opacity-40 bg-white/5 border border-white/10'
                      : 'bg-white/10 border border-white/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm ${hasInvitedClient ? 'bg-green-400 text-white' : 'bg-white/20 text-white'}`}>
                  {hasInvitedClient ? <CheckSquare size={16} /> : '3'}
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black ${hasInvitedClient ? 'line-through opacity-60' : ''}`}>Invita tu primer cliente</p>
                  <p className="text-[10px] text-blue-200 hidden sm:block">Comparte el link de registro</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in" key={currentTab}>

        {currentTab === 'agenda'      && <AgendaSection user={user} />}
        {currentTab === 'community'   && <CommunitySection user={user} />}
        {currentTab === 'biblioteca'  && <TrainerLibraryManager user={user} />}
        {currentTab === 'asistencia'  && <AttendanceView user={user} />}
        {currentTab === 'planes'      && <TrainerPlansManager user={user} />}
        {currentTab === 'analytics'   && <TrainerAnalyticsDashboard clients={clients} />}
        {currentTab === 'perfil'      && <TrainerProfileView user={user} />}

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
