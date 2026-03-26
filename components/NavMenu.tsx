
import React from 'react';
import { Home, Handshake, Calendar, Award, User, Gift, LogOut } from 'lucide-react';
import { View } from '../types';
import { views } from '../constants';

interface NavMenuProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isLoggedIn: boolean;
  handleLogout?: () => void;
}

const NavMenu: React.FC<NavMenuProps> = ({ currentView, setCurrentView, isLoggedIn, handleLogout }) => {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home, view: views.HOME },
    { id: 'plans', label: 'Planes', icon: Handshake, view: views.PLANS },
    { id: 'agenda', label: 'Agenda', icon: Calendar, view: views.AGENDA },
    { id: 'achievements', label: 'Comunidad', icon: Award, view: views.ACHIEVEMENTS },
    { id: 'login', label: 'Login', icon: User, view: views.LOGIN },
  ];

  const loggedInItems = [
    { id: 'dashboard', label: 'Panel', icon: User, view: views.DASHBOARD },
    { id: 'agenda', label: 'Agenda', icon: Calendar, view: views.AGENDA },
    { id: 'rewards-store', label: 'Tienda', icon: Gift, view: views.REWARDS_STORE },
    { id: 'achievements', label: 'Social', icon: Award, view: views.ACHIEVEMENTS },
    { id: 'logout', label: 'Salir', icon: LogOut, action: true }, 
  ];

  const displayedItems = isLoggedIn ? loggedInItems : navItems;
  const numItems = displayedItems.length;
  
  // Logic for the floating indicator calculation
  const currentIndex = displayedItems.findIndex(item => 'view' in item && item.view === currentView);
  // Default to 0 if not found, but hide it if it's logout (action)
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  
  // Calculate percentage for left position
  const indicatorWidthPercent = 100 / numItems;
  const indicatorLeftPercent = activeIndex * indicatorWidthPercent;

  const handleItemClick = (e: React.MouseEvent, item: any) => {
      // Haptic Visual Feedback
      const btn = e.currentTarget as HTMLButtonElement;
      btn.classList.add('scale-90');
      setTimeout(() => btn.classList.remove('scale-90'), 150);

      if (item.action && item.id === 'logout') {
          if (handleLogout) {
             handleLogout();
          }
      } else if (item.view) {
          setCurrentView(item.view);
      }
  };

  return (
    <nav className="container mx-auto h-full px-4 sm:px-6">
        {/* Constrain width to add whitespace on desktop */}
        <div className="relative h-full flex items-center justify-between max-w-2xl mx-auto">
          
          {displayedItems.map((item) => {
            const isLogout = item.id === 'logout';
            const isActive = !item.action && currentView === item.view;
            
            // Dynamic styling
            let iconClass = 'text-gray-400';
            let labelClass = 'text-gray-400 font-medium';
            let containerClass = 'hover:bg-gray-50';
            
            if (isLogout) {
                iconClass = 'text-red-500';
                labelClass = 'text-red-500 font-bold';
                containerClass = 'hover:bg-red-50';
            } else if (isActive) {
                iconClass = 'text-blue-600';
                labelClass = 'text-blue-600 font-bold';
            } else {
                iconClass = 'text-gray-400 group-hover:text-gray-600';
            }

            return (
                <button
                  key={item.id}
                  onClick={(e) => handleItemClick(e, item)}
                  className={`flex-1 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-200 active:scale-95 group rounded-xl py-2 ${containerClass} outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                  aria-label={item.label}
                  aria-selected={isActive}
                  role="tab"
                >
                  <div className={`
                    flex items-center justify-center 
                    w-12 h-12 mb-1 rounded-2xl transition-all duration-300
                    ${isActive ? 'bg-blue-50 scale-110 shadow-sm' : 'bg-transparent'}
                  `}>
                    <item.icon size={22} className={`transition-colors duration-300 ${iconClass}`} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] sm:text-xs tracking-wide transition-colors duration-300 ${labelClass}`}>
                    {item.label}
                  </span>
                </button>
            );
          })}
          
          {/* Refined Active Indicator (Bottom Line) */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-100/50 rounded-full overflow-hidden pointer-events-none">
             {currentIndex !== -1 && (
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  style={{ 
                      width: `${indicatorWidthPercent * 0.4}%`, // Only 40% of the slot width
                      marginLeft: `${indicatorLeftPercent + (indicatorWidthPercent * 0.3)}%` // Centered in the slot
                  }}
                ></div>
             )}
          </div>

        </div>
    </nav>
  );
};

export default NavMenu;
