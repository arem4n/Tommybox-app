import React, { useState } from 'react';
import { Flame, CheckCircle, Lock } from 'lucide-react';
import {
  ACHIEVEMENT_CATALOG,
  BADGE_CATALOG,
  calculateLevelInfo,
} from '../../services/gamification';
import { useGamification } from '../../hooks/useGamification';
import { AppUser } from '../../types';

interface GamificationViewProps {
  user: AppUser;
}


const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-500 border-gray-300 bg-gray-50',
  rare: 'text-blue-500 border-blue-300 bg-blue-50',
  epic: 'text-purple-500 border-purple-300 bg-purple-50',
  legendary: 'text-yellow-500 border-yellow-300 bg-yellow-50',
};

const RARITY_LABEL: Record<string, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};

const MONTHLY_CHALLENGE = {
  id: 'monthly_5_sessions',
  label: '🏆 Desafío del Mes',
  description: '5 sesiones este mes',
  target: 5,
  reward: 'Badge exclusivo + 50 XP',
};

const GamificationView: React.FC<GamificationViewProps> = ({ user }) => {
  const {
    gamification,
    monthSessions,
    newlyUnlockedBadge,
    dismissBadge,
  } = useGamification(user);

  const [activeTab, setActiveTab] = useState<'logros' | 'badges'>('logros');

  const totalPoints = gamification?.totalPoints || 0;
  const { level, progress, currentXpInLevel, xpForNextLevel } = calculateLevelInfo(totalPoints);
  const currentStreak = gamification?.streaks?.[0]?.current || 0;
  const bestStreak = gamification?.streaks?.[0]?.best || 0;

  return (
    <div className="space-y-6">
      {/* Badge Unlock Celebration Modal */}
      {newlyUnlockedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900 border border-yellow-400/30 shadow-2xl shadow-yellow-400/20 rounded-3xl p-8 text-center max-w-xs w-full mx-4 animate-bounce pointer-events-auto">
            <div className="text-7xl mb-4">{newlyUnlockedBadge.icon}</div>
            <div className={`text-xs font-black uppercase tracking-widest mb-2 ${
              newlyUnlockedBadge.rarity === 'legendary' ? 'text-yellow-400' :
              newlyUnlockedBadge.rarity === 'epic' ? 'text-purple-400' :
              newlyUnlockedBadge.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
            }`}>{RARITY_LABEL[newlyUnlockedBadge.rarity]} desbloqueado</div>
            <h3 className="text-2xl font-black text-white">{newlyUnlockedBadge.name}</h3>
            <p className="text-slate-400 text-sm mt-2">¡Felicitaciones! Conseguiste un nuevo badge 🎉</p>
            <button onClick={dismissBadge} className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm">¡Genial!</button>
          </div>
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Level Card */}
        <div className="col-span-1 md:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
            <Flame size={150} />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-blue-100 font-medium uppercase tracking-wider text-sm">Nivel actual</p>
              <h2 className="text-5xl font-black">{level}</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-blue-100 font-medium uppercase tracking-wider text-sm">Puntos totales</p>
              <h2 className="text-3xl font-bold">{totalPoints} XP</h2>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>{currentXpInLevel} XP</span>
              <span>{xpForNextLevel} XP para Nivel {level + 1}</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-3 overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="col-span-1 rounded-2xl p-6 bg-white border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center relative">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
            <Flame size={32} />
          </div>
          <h3 className="text-3xl font-black text-gray-900">{currentStreak} <span className="text-lg text-gray-500 font-medium">semanas</span></h3>
          <p className="text-gray-500 font-medium mt-1">Racha actual</p>
          <div className="mt-4 pt-4 border-t border-gray-100 w-full text-sm text-gray-400 font-medium">
            Récord histórico: {bestStreak} semanas
          </div>
        </div>
      </div>

      {/* Monthly Challenge */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-200">{MONTHLY_CHALLENGE.label}</span>
            <h3 className="text-lg font-black">{MONTHLY_CHALLENGE.description}</h3>
          </div>
          <img src="/custom-icons/desafio_del_mes.png" className="w-10 h-10 object-contain drop-shadow" alt="Desafío" />
        </div>
        <div className="w-full bg-blue-900/50 rounded-full h-3 mb-2">
          <div
            className="bg-white h-3 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(Math.round((monthSessions / MONTHLY_CHALLENGE.target) * 100), 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-blue-200">
          <span>{Math.min(monthSessions, MONTHLY_CHALLENGE.target)}/{MONTHLY_CHALLENGE.target} sesiones este mes</span>
          <span>🏅 {MONTHLY_CHALLENGE.reward}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('logros')}
            className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'logros' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Logros
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'badges' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Badges
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'logros' && (
            <div className="space-y-4">
              {ACHIEVEMENT_CATALOG.map((catalogAch) => {
                const userAch = gamification?.achievements?.find((a) => a.id === catalogAch.id);
                const progressVal = userAch?.progress || 0;
                const isCompleted = userAch?.completed || false;
                const progressPercent = Math.min((progressVal / catalogAch.total!) * 100, 100);
                return (
                  <div key={catalogAch.id} className="p-4 border border-gray-100 rounded-xl flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900">{catalogAch.title}</h4>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle size={14} />{catalogAch.points} XP
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-gray-400">{catalogAch.points} XP</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{catalogAch.description}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{progressVal} / {catalogAch.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {BADGE_CATALOG.map((catalogBadge) => {
                const userBadge = gamification?.badges?.find((b) => b.id === catalogBadge.id);
                const isUnlocked = !!userBadge;
                const colors = isUnlocked ? RARITY_COLORS[catalogBadge.rarity] : 'bg-gray-50 border-gray-200 text-gray-300';
                return (
                  <div
                    key={catalogBadge.id}
                    className={`p-4 border rounded-xl flex flex-col items-center text-center transition-all ${colors} ${!isUnlocked && 'grayscale opacity-60'}`}
                  >
                    <div className="text-4xl mb-3 relative">
                      {catalogBadge.icon}
                      {!isUnlocked && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <Lock size={12} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h4 className={`font-bold text-sm mb-1 ${!isUnlocked ? 'text-gray-500' : 'text-gray-900'}`}>{catalogBadge.name}</h4>
                    <p className="text-[10px] leading-tight text-gray-500">{catalogBadge.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamificationView;
