import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AgendaSection from './AgendaSection';
import CommunitySection from './CommunitySection';
import PlansSection from './PlansSection';
import { Calendar, Users, Star, LogOut } from 'lucide-react';
import { signOut } from '../../lib/auth';

interface DashboardLayoutProps {
  user: any;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'agenda';

  useEffect(() => {
      if (!searchParams.get('tab')) {
          setSearchParams({ tab: 'agenda' }, { replace: true });
      }
  }, [searchParams, setSearchParams]);

  const tabs = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'plan', label: 'My Plan', icon: Star },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black">
              T
            </div>
            <span className="font-black text-xl tracking-tight hidden sm:block">TOMMYBOX</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">
              {user.displayName}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              title="Logout"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium hidden md:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-2xl shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium text-sm sm:text-base transition-colors border-b-2 ${
                currentTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={20} />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-transparent min-h-[50vh]">
          {currentTab === 'agenda' && <AgendaSection user={user} />}
          {currentTab === 'community' && <CommunitySection user={user} />}
          {currentTab === 'plan' && <PlansSection user={user} />}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
