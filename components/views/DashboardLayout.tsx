import React, { useEffect } from 'react';
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
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'agenda';

  useEffect(() => {
      if (!user?.isTrainer && !searchParams.get('tab')) {
          setSearchParams({ tab: 'agenda' }, { replace: true });
      }
  }, [searchParams, setSearchParams, user]);

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
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'community', label: 'Comunidad', icon: Users },
    { id: 'plan', label: 'Mi Plan', icon: Star },
    { id: 'profile', label: 'Mi Perfil', icon: User },
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
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              title="Salir"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium hidden md:block">Salir</span>
            </button>
          </div>
        </div>

        {/* Row 2 — Tabs */}
        <div className="border-t border-gray-100">
            <div className="container mx-auto px-4 flex overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setSearchParams({ tab: tab.id })}
                    className={`flex items-center gap-2 py-3 px-5 font-medium text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
                        currentTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
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
          {currentTab === 'profile' && <ClientStatsView user={user} onUserUpdate={(updated) => {}} />}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
