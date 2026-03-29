import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AgendaSection from './AgendaSection';
import CommunitySection from './CommunitySection';
import PlansSection from './PlansSection';
import ClientStatsView from './ClientStatsView';
import TrainerDashboard from './TrainerDashboard';
import { Calendar, Users, Star, User, LogOut } from 'lucide-react';
import { signOut } from '../../lib/auth';

interface DashboardLayoutProps {
  user: any;
  onUserUpdate?: (updated: any) => void;
}
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onUserUpdate }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'agenda';

  useEffect(() => {
      if (!user?.isTrainer && !searchParams.get('tab')) {
          setSearchParams({ tab: 'agenda' }, { replace: true });
      }
  }, [searchParams, setSearchParams, user]);


  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  if (user?.isTrainer) {
      return <TrainerDashboard user={user} onLogout={handleLogout} />;
  }

  const tabs = [
  { id: 'agenda',    label: 'Agenda',    shortLabel: 'Agenda',  icon: Calendar },
  { id: 'community', label: 'Comunidad', shortLabel: 'Comunidad', icon: Users },
  { id: 'plan',      label: 'Mi Plan',   shortLabel: 'Plan',    icon: Star },
  { id: 'profile',   label: 'Mi Perfil', shortLabel: 'Perfil',  icon: User },
];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        {/* Row 1 */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png" alt="TommyBox" className="h-8 object-contain" />
            <span className="font-black text-xl tracking-tight hidden sm:block">TOMMYBOX</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">
              {user?.displayName}
            </span>
            {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-blue-100" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm hidden sm:flex">
                    {user?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
            )}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-bold"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
              <span className="text-sm font-bold hidden md:block">Salir</span>
            </button>
          </div>
        </div>

        {/* Row 2 — Tabs */}
        <div className="border-t border-gray-100">
            <div className="container mx-auto px-2 sm:px-4 flex justify-around sm:justify-start">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setSearchParams({ tab: tab.id })}
      className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-3 sm:px-5 font-medium text-xs sm:text-sm transition-colors border-b-2 -mb-px flex-1 sm:flex-none ${
        currentTab === tab.id
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      <tab.icon size={20} />
      <span className="hidden sm:inline">{tab.label}</span>
      <span className="inline sm:hidden text-[10px] font-semibold">{(tab as any).shortLabel}</span>
    </button>
  ))}
</div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-transparent min-h-[50vh]">
          {currentTab === 'agenda' && <AgendaSection user={user} />}
          {currentTab === 'community' && <CommunitySection user={user} />}
          {currentTab === 'plan' && <PlansSection user={user} />}
          {currentTab === 'profile' && <ClientStatsView user={user} onUserUpdate={(updated) => onUserUpdate?.(updated)} />}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 animate-scale-up">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar sesión?</h3>
              <p className="text-gray-500 mb-6">
                Estás a punto de salir de tu cuenta.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
