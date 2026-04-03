import React from 'react';

interface HamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({ isOpen, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700/50 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${className}`}
      aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
    >
      <div className="w-6 h-6 relative">
         <img
            src="/custom-icons/hamburger_lines.png"
            alt="Menu"
            className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`}
         />
         <img
            src="/custom-icons/hamburger_x.png"
            alt="Close"
            className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`}
         />
      </div>
    </button>
  );
};
