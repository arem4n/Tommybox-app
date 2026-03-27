import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AgendaSection from './AgendaSection';
import CommunitySection from './CommunitySection';
import PlansSection from './PlansSection';
import { Calendar, Users, Star } from 'lucide-react';

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm p-4 min-h-[50vh]">
        {currentTab === 'agenda' && <AgendaSection user={user} />}
        {currentTab === 'community' && <CommunitySection user={user} />}
        {currentTab === 'plan' && <PlansSection user={user} />}
      </div>
    </div>
  );
};

export default DashboardLayout;
