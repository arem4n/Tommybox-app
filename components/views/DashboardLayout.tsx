import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
const AgendaSection = lazy(() => import('./AgendaSection'));
const CommunitySection = lazy(() => import('./CommunitySection'));
const PlansSection = lazy(() => import('./PlansSection'));
const LibrarySection = lazy(() => import('./LibrarySection'));
import ClientStatsView from './ClientStatsView';
const TrainerDashboard = lazy(() => import('./TrainerDashboard'));
import { Calendar, MessageCircle, CreditCard, User, LogOut, Trophy, Loader2, BookOpen } from 'lucide-react';
const GamificationView = lazy(() => import('./GamificationView'));
import { signOut } from '../../lib/auth';

const LoadingSpinner = () => (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
);

interface DashboardLayoutProps {
  user: any;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
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
    { id: 'agenda',     label: 'Agenda',     imgSrc: '/custom-icons/nav_calendar.png' },
    { id: 'community',  label: 'Comunidad',  imgSrc: '/custom-icons/nav_community.png' },
    { id: 'plan',       label: 'Mi Plan',    imgSrc: '/custom-icons/nav_plan.png' },
    { id: 'logros',     label: 'Logros',     imgSrc: '/custom-icons/nav_achievements.png' },
    { id: 'biblioteca', label: 'Biblioteca', imgSrc: '/custom-icons/nav_library.png' },
    { id: 'profile',    label: 'Mi Perfil',  imgSrc: '/custom-icons/nav_profile.png' },
  ];

  return (
    <Suspense fallback={<LoadingSpinner />}><div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-10 shadow-lg shadow-black/20">
        {/* Row 1 */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-header.png" alt="TommyBox" className="h-9 object-contain" />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-400 hidden sm:block">
              {user?.displayName}
            </span>
            {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-blue-100" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-bold text-sm hidden sm:flex">
                    {user?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
    <LogOut className="w-4 h-4" />
    <span className="hidden sm:inline">Cerrar sesión</span>
  </button>
          </div>
        </div>

        {/* Row 2 — Tabs */}
        <div className="bg-slate-900 border-t border-slate-800">
            <div className="container mx-auto px-2 sm:px-4 flex justify-between sm:justify-start w-full">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setSearchParams({ tab: tab.id })}
                    className={`flex flex-col sm:flex-row items-center justify-center sm:gap-2 py-3 px-1 sm:px-5 font-bold text-[10px] sm:text-sm transition-all border-b-2 flex-1 sm:flex-none whitespace-nowrap ${
                        currentTab === tab.id
                        ? 'border-white text-white opacity-100'
                        : 'border-transparent text-slate-300 hover:text-white hover:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={tab.imgSrc} alt={tab.label} className="w-6 h-6 mb-1 sm:mb-0 opacity-90" />
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
          {currentTab === 'logros' && <GamificationView user={user} />}
          {currentTab === 'biblioteca' && <LibrarySection user={user} />}
          {currentTab === 'profile' && <ClientStatsView user={user} onUserUpdate={(updated) => setUser(updated as any)} />}
        </div>
      </main>
    </div></Suspense>
  );
};

export default DashboardLayout;
