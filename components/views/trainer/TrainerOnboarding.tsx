import React from 'react';
import { CheckSquare, ArrowRight } from 'lucide-react';

interface TrainerOnboardingProps {
  profileComplete: boolean;
  plansConfigured: boolean;
  hasInvitedClient: boolean;
  onNavigate: (tab: any) => void;
}

const TrainerOnboarding: React.FC<TrainerOnboardingProps> = ({
  profileComplete,
  plansConfigured,
  hasInvitedClient,
  onNavigate
}) => {
  const onboardingDone = profileComplete && plansConfigured && hasInvitedClient;
  if (onboardingDone) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-4 shadow-md">
      <div className="container mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-wider text-blue-200 mb-3">🚀 Primeros pasos como entrenador</p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* Step 1 */}
          <button
            onClick={() => onNavigate('perfil')}
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
            onClick={() => onNavigate('planes')}
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
  );
};

export default TrainerOnboarding;
