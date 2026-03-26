import React, { useEffect, useState } from 'react';
import { Award, Star, Trophy, Zap } from 'lucide-react';
import { PointsAwarded, Badge } from '../types';

interface RewardNotificationProps {
    reward: PointsAwarded;
    onDismiss: () => void;
}

const RewardNotification: React.FC<RewardNotificationProps> = ({ reward, onDismiss }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 300); // Wait for fade out animation
        }, 4000); // Increased duration for better readability

        return () => clearTimeout(timer);
    }, [reward, onDismiss]);

    return (
        <div className={`fixed top-20 right-4 z-[100] w-auto max-w-sm rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-2xl transition-all duration-300 ease-in-out transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className="p-4">
                {/* Points earned */}
                {reward.points > 0 && (
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="text-yellow-400 flex-shrink-0" size={24} />
                      <span className="text-white font-bold text-xl">+{reward.points} Puntos</span>
                    </div>
                )}
                
                {/* Badges unlocked */}
                {reward.newBadges.length > 0 && (
                  <div className="mt-3 bg-white/10 rounded p-2">
                    <p className="text-white text-sm mb-1 font-semibold">¡Insignia Desbloqueada!</p>
                    {reward.newBadges.map((badge: Badge) => (
                      <div key={badge.id} className="flex items-center gap-2">
                        <span className="text-2xl">{badge.icon}</span>
                        <span className="text-white font-semibold">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Level Up */}
                {reward.leveledUp && (
                  <div className="mt-3 bg-purple-600 rounded p-3 text-center">
                    <Trophy className="mx-auto text-yellow-300 mb-1" size={32} />
                    <p className="text-white font-bold text-lg">¡ALCANZASTE EL NIVEL {reward.newLevel}!</p>
                  </div>
                )}
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-progress"></div>
            <style>{`
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-progress {
                    animation: progress 4s linear forwards;
                }
            `}</style>
        </div>
    );
};

export default RewardNotification;
