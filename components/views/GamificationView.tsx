import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, addDoc, collection, Timestamp } from 'firebase/firestore';
import { Flame, CheckCircle, Lock } from 'lucide-react';
import {
    ACHIEVEMENT_CATALOG,
    BADGE_CATALOG,
    calculateLevelInfo,
    canPerformAction,
    incrementActionCount,
    recalculateGamification
} from '../../services/gamification';
import { GamificationProfile } from '../../types';

interface GamificationViewProps {
    user: any;
}

const FEELINGS_OPTIONS = [
    { label: 'Excelente 🔥', value: 'Excelente' },
    { label: 'Bien 💪', value: 'Bien' },
    { label: 'Normal 😐', value: 'Normal' },
    { label: 'Cansado 😓', value: 'Cansado' },
    { label: 'Muy duro 😤', value: 'Muy duro' },
];

const RARITY_COLORS: Record<string, string> = {
    common: 'text-gray-500 border-gray-300 bg-gray-50',
    rare: 'text-blue-500 border-blue-300 bg-blue-50',
    epic: 'text-purple-500 border-purple-300 bg-purple-50',
    legendary: 'text-yellow-500 border-yellow-300 bg-yellow-50',
};

const GamificationView: React.FC<GamificationViewProps> = ({ user }) => {
    const [gamification, setGamification] = useState<GamificationProfile | null>(user?.gamification || null);
    const [activeTab, setActiveTab] = useState<'logros' | 'badges'>('logros');
    const [canRegisterFeeling, setCanRegisterFeeling] = useState<boolean>(false);
    const [selectedFeeling, setSelectedFeeling] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.gamification) {
                    setGamification(data.gamification);
                }
            }
        });
        return () => unsubscribe();
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        canPerformAction(user.id, 'POST_WORKOUT_SENSATION').then(setCanRegisterFeeling);
    }, [user?.id]);

    const handleRegisterFeeling = async () => {
        if (!user?.id || !selectedFeeling) return;
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            await addDoc(collection(db, 'users', user.id, 'feelings'), {
                feeling: selectedFeeling,
                comment,
                date: todayStr,
                timestamp: Timestamp.now()
            });
            await incrementActionCount(user.id, 'POST_WORKOUT_SENSATION');
            await recalculateGamification(user.id);
            setCanRegisterFeeling(false);
            setSuccessMessage('+5 XP');
            setTimeout(() => setSuccessMessage(''), 3000);
            setSelectedFeeling('');
            setComment('');
        } catch (error) {
            console.error("Error registering feeling", error);
        }
    };

    const totalPoints = gamification?.totalPoints || 0;
    const { level, progress, currentXpInLevel, xpForNextLevel } = calculateLevelInfo(totalPoints);
    const currentStreak = gamification?.streaks?.[0]?.current || 0;
    const bestStreak = gamification?.streaks?.[0]?.best || 0;

    return (
        <div className="space-y-6">
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

            {/* Daily Check-in */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Check-in de sensación post-entreno</h3>
                {!canRegisterFeeling ? (
                    <div className="flex items-center justify-center gap-2 p-6 bg-gray-50 rounded-xl text-gray-500 font-medium">
                        <Lock size={20} />
                        <span>Ya registraste tu sensación hoy. ¡Vuelve mañana!</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {FEELINGS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSelectedFeeling(opt.value)}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                                        selectedFeeling === opt.value
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={200}
                            placeholder="Nota opcional sobre tu entrenamiento (máx. 200 caracteres)..."
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 text-sm"
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{comment.length}/200</span>
                            <div className="flex items-center gap-4">
                                {successMessage && <span className="text-green-600 font-bold animate-pulse">{successMessage}</span>}
                                <button
                                    onClick={handleRegisterFeeling}
                                    disabled={!selectedFeeling}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                            {ACHIEVEMENT_CATALOG.map(catalogAch => {
                                const userAch = gamification?.achievements?.find(a => a.id === catalogAch.id);
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
                                                        <CheckCircle size={14} />
                                                        {catalogAch.points} XP
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
                                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                                    {progressVal} / {catalogAch.total}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'badges' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {BADGE_CATALOG.map(catalogBadge => {
                                const userBadge = gamification?.badges?.find(b => b.id === catalogBadge.id);
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
