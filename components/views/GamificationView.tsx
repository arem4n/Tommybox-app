import { useModal } from '../../contexts/ModalContext';
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, addDoc, collection, query, where, Timestamp } from 'firebase/firestore';
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
    const [gamification, setGamification] = useState<GamificationProfile | null>(user?.gamification || null);
    const { showAchievement } = useModal();
    const [activeTab, setActiveTab] = useState<'logros' | 'badges'>('logros');
    const [canRegisterFeeling, setCanRegisterFeeling] = useState<boolean>(false);
    const [selectedFeeling, setSelectedFeeling] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [recoveryNotes, setRecoveryNotes] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [newBadge, setNewBadge] = useState<{ icon: string; name: string; rarity: string } | null>(null);
    const [monthSessions, setMonthSessions] = useState<number>(0);

    // Persist seen badge IDs in localStorage to survive re-mounts
    const getStoredBadgeIds = (): Set<string> => {
        try {
            const raw = localStorage.getItem(`tb_badges_${user?.id}`);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch { return new Set(); }
    };
    const storeBadgeIds = (ids: Set<string>) => {
        try { localStorage.setItem(`tb_badges_${user?.id}`, JSON.stringify([...ids])); } catch {}
    };

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.gamification) {
                    const newGam: GamificationProfile = data.gamification;
                    const incoming = new Set((newGam.badges || []).map((b: any) => b.id as string));
                    const stored = getStoredBadgeIds();

                    // Only show popup for genuinely new badges (not seen before this session)
                    if (stored.size > 0) {
                        for (const badge of (newGam.badges || [])) {
                            if (!stored.has(badge.id)) {
                                setNewBadge({ icon: badge.icon, name: badge.name, rarity: badge.rarity });
                                setTimeout(() => setNewBadge(null), 6000);
                                break;
                            }
                        }
                    }
                    storeBadgeIds(incoming);
                    setGamification(newGam);
                }
            }
        });
        return () => unsubscribe();
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        canPerformAction(user.id, 'POST_WORKOUT_SENSATION').then(setCanRegisterFeeling);
    }, [user?.id]);

    // Fetch real current-month sessions count
    useEffect(() => {
        if (!user?.id) return;
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const q = query(
            collection(db, `agenda/${user.id}/events`),
            where('date', '>=', `${monthPrefix}-01`),
            where('date', '<=', `${monthPrefix}-31`)
        );
        const unsub = onSnapshot(q, snap => {
            setMonthSessions(snap.size);
        });
        return () => unsub();
    }, [user?.id]);

    const handleRegisterFeeling = async () => {
        if (!user?.id || !selectedFeeling) return;
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            await addDoc(collection(db, 'users', user.id, 'feelings'), {
                feeling: selectedFeeling,
                comment,
                recoveryNotes,
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
            setRecoveryNotes('');
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
          {/* Badge Unlock Celebration Modal */}
          {newBadge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900 border border-yellow-400/30 shadow-2xl shadow-yellow-400/20 rounded-3xl p-8 text-center max-w-xs w-full mx-4 animate-bounce pointer-events-auto">
                <div className="text-7xl mb-4">{newBadge.icon}</div>
                <div className={`text-xs font-black uppercase tracking-widest mb-2 ${
                  newBadge.rarity === 'legendary' ? 'text-yellow-400' :
                  newBadge.rarity === 'epic' ? 'text-purple-400' :
                  newBadge.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
                }`}>{RARITY_LABEL[newBadge.rarity]} desbloqueado</div>
                <h3 className="text-2xl font-black text-white">{newBadge.name}</h3>
                <p className="text-slate-400 text-sm mt-2">¡Felicitaciones! Conseguiste un nuevo badge 🎉</p>
                <button onClick={() => setNewBadge(null)} className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm">¡Genial!</button>
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

                {/* Daily Check-in */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Check-in post-entreno</h3>
                <p className="text-xs text-gray-400 mb-4">¿Cómo te sentiste hoy? +5 XP por registrar</p>
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
                            placeholder="¿Cómo estuvo el entreno? (opcional)"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 text-sm"
                        />
                        <textarea
                            value={recoveryNotes}
                            onChange={(e) => setRecoveryNotes(e.target.value)}
                            maxLength={150}
                            placeholder="Notas de recuperación: sueño, dolores, energía... (opcional)"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16 text-sm"
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

            {/* Monthly Challenge */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-200">{MONTHLY_CHALLENGE.label}</span>
                  <h3 className="text-lg font-black">{MONTHLY_CHALLENGE.description}</h3>
                </div>
                <span className="text-3xl">🎯</span>
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
