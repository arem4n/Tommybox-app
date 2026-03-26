
import { Achievement, Badge, Feeling, Metric, Observation, Session, UserProfile, GamificationProfile, DailyActionTracker, PointsAwarded, Streak, RewardItem, RedeemedReward, isBirthdayToday } from '../types';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp generator
export const mockTimestamp = (date: Date): Timestamp => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
} as unknown as Timestamp);

// --- GAMIFICATION CONFIG ---

const POINT_REWARDS = {
  SESSION_COMPLETED: 10, // Legacy, use BOOK_SESSION instead for now
  POST_WORKOUT_SENSATION: 5,
  DETAILED_SENSATION: 10,
  APPROVE_ACHIEVEMENT: 50,
  BOOK_SESSION: 10,
  STREAK_3_DAYS: 15,
  STREAK_7_DAYS: 30,
  CHECK_IN: 15,
  BIRTHDAY_BONUS: 100,
  BIRTHDAY_CHECK_IN_BONUS: 50,
};

const DAILY_LIMITS = {
  POST_WORKOUT_SENSATION: 1,
  CHECK_IN: 1,
};

export const LEVEL_TITLES: { [key: number]: string } = {
  1: 'Novato',
  5: 'Aprendiz',
  10: 'Atleta en Progreso',
  15: 'Competidor',
  20: 'Atleta Avanzado',
  25: 'Maestro del Fitness',
  30: 'Leyenda de TommyBox',
};

const BADGES_CATALOG: { [key: string]: Omit<Badge, 'id' | 'unlockedAt'> } = {
  'first-booking': { name: 'Primer Paso', description: 'Agendaste tu primera sesión.', icon: '📅', rarity: 'common', category: 'milestone' },
  'feedback-pro-5': { name: 'Comunicador', description: 'Dejaste 5 feedbacks de sesión.', icon: '💬', rarity: 'rare', category: 'consistency' },
  'social-star-3': { name: 'Estrella Social', description: 'Compartiste 3 logros con la comunidad.', icon: '⭐', rarity: 'rare', category: 'social' },
  'level-5': { name: 'Nivel 5', description: 'Alcanzaste el Nivel 5. ¡Imparable!', icon: '🚀', rarity: 'epic', category: 'milestone' },
  'unstoppable-7': { name: 'Imparable', description: 'Racha de 7 días consecutivos de entrenamiento.', icon: '🔥', rarity: 'epic', category: 'consistency'},
  'birthday-badge': { name: 'Cumpleañero', description: '¡Celebraste tu cumpleaños con nosotros!', icon: '🎂', rarity: 'rare', category: 'special' }
};

export const REWARD_CATALOG: RewardItem[] = [
  { 
      id: 'bottle', 
      name: 'Botella TommyBox', 
      description: 'Botella de agua de acero inoxidable para tus entrenamientos.', 
      pointsCost: 200,
      price: 15000,
      category: 'merch', 
      imageUrl: 'https://i.postimg.cc/7hmh2RNF/1764191495962.jpg', 
      stock: 10, 
      icon: '🍶' 
  },
  { 
      id: 'shirt', 
      name: 'Polera TommyBox', 
      description: 'Polera oficial de TommyBox. Tela respirable y cómoda.', 
      pointsCost: 500,
      price: 25000,
      category: 'merch', 
      imageUrl: 'https://i.postimg.cc/CLbZLZj7/20251126-163614-0000.png', 
      stock: 15, 
      icon: '👕' 
  },
  { 
      id: 'cap', 
      name: 'Gorra TommyBox', 
      description: 'Gorra estilo trucker para protegerte del sol con estilo.', 
      pointsCost: 400,
      price: 18000,
      category: 'merch', 
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=500', 
      stock: 12, 
      icon: '🧢' 
  },
  { 
      id: 'extra_session', 
      name: 'Sesión Extra Gratis', 
      description: 'Una sesión de entrenamiento adicional personalizada.', 
      pointsCost: 600,
      price: 20000,
      category: 'exclusive', 
      imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=500', 
      stock: 'unlimited', 
      icon: '💪' 
  },
  { 
      id: 'discount', 
      name: 'Descuento 20% Mes', 
      description: '20% de descuento en tu próxima mensualidad.', 
      pointsCost: 800,
      price: 0, // Cannot be bought, only redeemed
      category: 'subscription', 
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=500', 
      stock: 'unlimited', 
      icon: '🎟️' 
  },
];


// --- SERIALIZATION HELPERS ---
const replacer = (key: string, value: any) => {
  if (key === 'timestamp' || key === 'lastUpdate' || key === 'unlockedAt' || key === 'redeemedAt') {
    if (value && typeof value.toDate === 'function') {
      return { __type: 'Timestamp', value: value.toDate().toISOString() };
    }
  }
  return value;
};

const reviver = (key: string, value: any) => {
  if (value && value.__type === 'Timestamp') {
    return mockTimestamp(new Date(value.value));
  }
  return value;
};


// --- INITIAL DEFAULT DATA ---
const createDefaultGamificationProfile = (userId: string): GamificationProfile => ({
    userId: userId,
    totalPoints: 0,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    badges: [],
    achievements: [
      { id: 'ach_attendance_10', title: 'Asistencia de Acero', description: 'Completa 10 sesiones', points: 50, progress: 0, total: 10, completed: false, type: 'attendance', text: '', userEmail: '', timestamp: mockTimestamp(new Date()) },
      { id: 'ach_feedback_20', title: 'Feedback Fanático', description: 'Registra 20 sensaciones post-entrenamiento', points: 75, progress: 0, total: 20, completed: false, type: 'feedback', text: '', userEmail: '', timestamp: mockTimestamp(new Date()) }
    ],
    streaks: [
        { type: 'training', current: 0, best: 0, lastUpdate: mockTimestamp(new Date(0)) }
    ],
});

const initialTrainer: UserProfile & { id: string } = {
  id: 'trainer01',
  email: 'admin@tomybox.com',
  username: 'tommytrainer',
  displayName: 'Tommy',
  password: '12345678',
  isTrainer: true,
  createdAt: mockTimestamp(new Date('2023-01-01')),
  gamification: createDefaultGamificationProfile('trainer01'),
  registrationCompleted: true,
  photoURL: undefined,
};

const initialClients: (UserProfile & { id: string })[] = [
  {
    id: 'client01',
    email: 'maria.g@example.com',
    username: 'mariag',
    displayName: 'María G.',
    birthDate: '1995-08-15',
    registrationCompleted: true,
    password: 'password1',
    plan: '2 Sesiones / Semana',
    isTrainer: false,
    createdAt: mockTimestamp(new Date('2023-05-10')),
    gamification: { ...createDefaultGamificationProfile('client01'), totalPoints: 250, level: 3, experience: 0, experienceToNextLevel: 250 },
    photoURL: undefined,
  },
  {
    id: 'client02',
    email: 'juan.p@example.com',
    username: 'juanp',
    displayName: 'Juan P.',
    birthDate: '1990-12-25',
    registrationCompleted: true,
    password: 'password2',
    plan: '1 Sesión / Semana',
    isTrainer: false,
    createdAt: mockTimestamp(new Date('2023-06-15')),
    gamification: { ...createDefaultGamificationProfile('client02'), totalPoints: 120, level: 2, experience: 20, experienceToNextLevel: 150 },
    photoURL: undefined,
  },
  {
    id: 'client03',
    email: 'ana.f@example.com',
    username: 'anaf',
    displayName: 'Ana F.',
    birthDate: '1988-04-20',
    registrationCompleted: true,
    password: 'password3',
    plan: '3 Sesiones / Semana',
    isTrainer: false,
    createdAt: mockTimestamp(new Date('2024-01-20')),
    gamification: { ...createDefaultGamificationProfile('client03'), totalPoints: 850, level: 10, experience: 50, experienceToNextLevel: 1000 },
    photoURL: undefined,
  },
  {
    id: 'client04',
    email: 'carlos.s@example.com',
    username: 'carloss',
    displayName: 'Carlos S.',
    birthDate: '2000-11-01',
    registrationCompleted: true,
    password: 'password4',
    plan: undefined,
    isTrainer: false,
    createdAt: mockTimestamp(new Date('2024-03-15')),
    gamification: { ...createDefaultGamificationProfile('client04'), totalPoints: 50, level: 1, experience: 50, experienceToNextLevel: 100 },
    photoURL: undefined,
  },
  {
    id: 'client05',
    email: 'sofia.r@example.com',
    username: 'sofiar',
    displayName: 'Sofía R.',
    birthDate: '1998-03-10',
    registrationCompleted: true,
    password: 'password5',
    plan: '2 Sesiones / Semana',
    isTrainer: false,
    createdAt: mockTimestamp(new Date('2024-04-01')),
    gamification: { ...createDefaultGamificationProfile('client05'), totalPoints: 300, level: 4, experience: 0, experienceToNextLevel: 450 },
    photoURL: undefined,
  },
  {
    id: 'client06',
    email: 'pedro.d@example.com',
    username: 'pedrod',
    displayName: 'Pedro D.',
    birthDate: '2001-07-22',
    registrationCompleted: true,
    password: 'password6',
    plan: '1 Sesión / Semana',
    isTrainer: false,
    createdAt: mockTimestamp(new Date('2024-05-20')),
    gamification: createDefaultGamificationProfile('client06'),
    photoURL: undefined,
  },
  {
    id: 'client07',
    email: 'Sergio.Areman@gmail.com', // Capital S as requested
    username: 'sergio.areman',
    displayName: 'Sergio Areman',
    birthDate: '1992-06-20',
    registrationCompleted: true,
    password: '123456',
    plan: '3 Sesiones / Semana', // Gave him a plan so he can schedule
    isTrainer: false,
    createdAt: mockTimestamp(new Date('2024-06-01')),
    gamification: createDefaultGamificationProfile('client07'),
    photoURL: undefined,
  }
];

const initialUsers = [initialTrainer, ...initialClients];

type MockData = {
  [userId: string]: {
    metrics: Metric[];
    observations: Observation[];
    feelings: Feeling[];
    sessions: Session[];
    notifications?: any[];
  };
};

let dailyTrackers: DailyActionTracker[] = [];

// Helper to create date for this week
const getThisWeekDate = (dayOffset: number, hour: string) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0-6
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + dayOffset; 
    const d = new Date(today.setDate(diff));
    const [h, m] = hour.split(':');
    d.setHours(parseInt(h), parseInt(m), 0, 0);
    return d.toISOString().split('T')[0];
};

const initialDb: MockData = {
  'trainer01': { metrics: [], observations: [], feelings: [], sessions: [], notifications: [{title: "Bienvenido", message:"El panel de notificaciones está activo.", date: new Date().toISOString() }] },
  'client01': { // María G.
    metrics: [
      { id: 'm1', exercise: 'Sentadilla', load: 50, reps: 10, rpe: 7, date: '2024-05-10', timestamp: mockTimestamp(new Date('2024-05-10')) },
      { id: 'm2', exercise: 'Press de Banca', load: 40, reps: 8, rpe: 8, date: '2024-05-10', timestamp: mockTimestamp(new Date('2024-05-10')) },
    ],
    observations: [
      { id: 'o1', comment: 'Gran mejora en la técnica de sentadilla.', date: '2024-05-10', timestamp: mockTimestamp(new Date('2024-05-10')) },
    ],
    feelings: [
      { id: 'f1', feeling: 'Excelente', date: '2024-05-10', timestamp: mockTimestamp(new Date('2024-05-10')) },
    ],
    sessions: [
      { id: 's_m1', date: getThisWeekDate(0, '10:00'), time: '10:00', timestamp: mockTimestamp(new Date()) }, // Monday 10am
      { id: 's_m2', date: getThisWeekDate(2, '10:00'), time: '10:00', timestamp: mockTimestamp(new Date()) }, // Wednesday 10am
    ]
  },
  'client02': { // Juan P.
    metrics: [], observations: [], feelings: [], 
    sessions: [
        { id: 's_j1', date: getThisWeekDate(1, '18:00'), time: '18:00', timestamp: mockTimestamp(new Date()) }, // Tuesday 6pm
        { id: 's_j2', date: getThisWeekDate(3, '18:00'), time: '18:00', timestamp: mockTimestamp(new Date()) }, // Thursday 6pm
    ] 
  },
  'client03': { // Ana F.
    metrics: [], observations: [], feelings: [], 
    sessions: [
      { id: 's_a1', date: getThisWeekDate(0, '09:00'), time: '09:00', timestamp: mockTimestamp(new Date()) }, // Monday 9am
      { id: 's_a2', date: getThisWeekDate(2, '09:00'), time: '09:00', timestamp: mockTimestamp(new Date()) }, // Wednesday 9am
      { id: 's_a3', date: getThisWeekDate(4, '09:00'), time: '09:00', timestamp: mockTimestamp(new Date()) }, // Friday 9am
    ] 
  },
  'client04': { // Carlos S. (Sin plan inicial)
    metrics: [], observations: [], feelings: [], sessions: [] 
  },
  'client05': { // Sofía R.
    metrics: [], observations: [], feelings: [], 
    sessions: [
      { id: 's_s1', date: getThisWeekDate(1, '09:00'), time: '09:00', timestamp: mockTimestamp(new Date()) }, // Tuesday 9am
      { id: 's_s2', date: getThisWeekDate(3, '09:00'), time: '09:00', timestamp: mockTimestamp(new Date()) } // Thursday 9am
    ] 
  },
  'client06': { // Pedro D.
    metrics: [], observations: [], feelings: [], sessions: [] 
  },
  'client07': { // Sergio Areman
    metrics: [], observations: [], feelings: [], 
    sessions: [
         { id: 's_sa1', date: getThisWeekDate(2, '19:00'), time: '19:00', timestamp: mockTimestamp(new Date()) } // Wednesday 7pm
    ] 
  }
};

const initialPublicAchievements: Achievement[] = [
    { id: 'a1', text: '¡Completé mi primer mes de entrenamiento!', userEmail: 'maria.g@example.com', timestamp: mockTimestamp(new Date('2024-06-10')) },
    { id: 'a2', text: '¡Logré levantar 50kg en sentadilla!', userEmail: 'maria.g@example.com', timestamp: mockTimestamp(new Date('2024-05-18')) }
];

const initialPendingAchievements: any[] = [
    { id: 'pa1', text: 'Corrí 5km por primera vez', userEmail: 'juan.p@example.com', userId: 'client02', timestamp: mockTimestamp(new Date()) }
];

const initialChatMessages: { [chatId: string]: any[] } = {
  'client01_trainer01': [
    { id: 'msg1', senderId: 'client01', text: 'Hola, ¿cómo estás?', timestamp: { toDate: () => new Date(Date.now() - 2 * 60 * 1000) } },
    { id: 'msg2', senderId: 'trainer01', text: '¡Hola! Todo bien, ¿listo para entrenar hoy?', timestamp: { toDate: () => new Date(Date.now() - 1 * 60 * 1000) } },
  ],
  'client02_trainer01': [
    { id: 'msg3', senderId: 'client02', text: 'Hola, tengo una duda sobre un ejercicio.', timestamp: { toDate: () => new Date(Date.now() - 5 * 60 * 1000) } },
  ]
};

// --- DATA STORES ---
export let mockUsers: (UserProfile & { id: string })[] = [];
export let mockDb: MockData = {};
export let mockPublicAchievements: Achievement[] = [];
export let mockPendingAchievements: any[] = [];
export let mockChatMessages: { [chatId: string]: any[] } = {};
export let mockRedeemedRewards: RedeemedReward[] = [];
export let mockRewardStock: { rewardId: string; remaining: number }[] = [];
export const mockTrainer = initialTrainer;

// --- DATA PERSISTENCE FUNCTIONS ---
const saveData = () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    const doSave = () => {
        try {
            localStorage.setItem('tommybox_users', JSON.stringify(mockUsers, replacer));
            localStorage.setItem('tommybox_db', JSON.stringify(mockDb, replacer));
            localStorage.setItem('tommybox_public_achievements', JSON.stringify(mockPublicAchievements, replacer));
            localStorage.setItem('tommybox_pending_achievements', JSON.stringify(mockPendingAchievements, replacer));
            localStorage.setItem('tommybox_chat_messages', JSON.stringify(mockChatMessages, replacer));
            localStorage.setItem('tommybox_daily_trackers', JSON.stringify(dailyTrackers, replacer));
            localStorage.setItem('tommybox_redeemed_rewards', JSON.stringify(mockRedeemedRewards, replacer));
            localStorage.setItem('tommybox_reward_stock', JSON.stringify(mockRewardStock, replacer));
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    };

    // Performance Optimization: Use requestIdleCallback or setTimeout to avoid blocking main thread
    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(doSave);
    } else {
        setTimeout(doSave, 0);
    }
};

const sanitizeTimestamp = (obj: any): any => {
    if (!obj) return obj;
    // If it has toMillis, it's already good
    if (typeof obj.toMillis === 'function') return obj;
    // If it is our serialized shape
    if (obj.__type === 'Timestamp' && obj.value) {
        return mockTimestamp(new Date(obj.value));
    }
    // If it has seconds/nanoseconds (legacy firestore style)
    if (typeof obj.seconds === 'number') {
        return mockTimestamp(new Date(obj.seconds * 1000));
    }
    // If it's a date string
    if (typeof obj === 'string' && !isNaN(Date.parse(obj))) {
        return mockTimestamp(new Date(obj));
    }
    // Default fallback
    return mockTimestamp(new Date());
};

const sanitizeData = () => {
    // Helper to fix arrays of objects with timestamps
    const fixList = (list: any[], tsKeys: string[]) => {
        return list.map(item => {
            const newItem = { ...item };
            tsKeys.forEach(key => {
                if (newItem[key]) newItem[key] = sanitizeTimestamp(newItem[key]);
            });
            return newItem;
        });
    };

    // Sanitize DB
    Object.keys(mockDb).forEach(uid => {
        const u = mockDb[uid];
        if (u.metrics) u.metrics = fixList(u.metrics, ['timestamp']);
        if (u.observations) u.observations = fixList(u.observations, ['timestamp']);
        if (u.feelings) u.feelings = fixList(u.feelings, ['timestamp']);
        if (u.sessions) u.sessions = fixList(u.sessions, ['timestamp']);
    });

    // Sanitize Public Achievements
    mockPublicAchievements = fixList(mockPublicAchievements, ['timestamp', 'completedAt']);
};

const loadData = () => {
    const initDefaultData = () => {
        mockUsers = [...initialUsers];
        mockDb = JSON.parse(JSON.stringify(initialDb)); // Deep copy to avoid mutation issues
        mockPublicAchievements = [...initialPublicAchievements];
        mockPendingAchievements = [...initialPendingAchievements];
        mockChatMessages = JSON.parse(JSON.stringify(initialChatMessages));
        dailyTrackers = [];
        mockRedeemedRewards = [];
        mockRewardStock = [];
        saveData();
    };

    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        initDefaultData();
        return;
    }

    try {
        const usersData = localStorage.getItem('tommybox_users');
        const dbData = localStorage.getItem('tommybox_db');
        const publicAchievementsData = localStorage.getItem('tommybox_public_achievements');
        const pendingAchievementsData = localStorage.getItem('tommybox_pending_achievements');
        const chatMessagesData = localStorage.getItem('tommybox_chat_messages');
        const dailyTrackersData = localStorage.getItem('tommybox_daily_trackers');
        const redeemedRewardsData = localStorage.getItem('tommybox_redeemed_rewards');
        const rewardStockData = localStorage.getItem('tommybox_reward_stock');
        
        const allDataExists = [usersData, dbData, publicAchievementsData, pendingAchievementsData, chatMessagesData, dailyTrackersData, redeemedRewardsData, rewardStockData].every(Boolean);

        if (allDataExists) {
            mockUsers = JSON.parse(usersData!, reviver);
            mockDb = JSON.parse(dbData!, reviver);
            
            // SAFETY CHECK: Ensure structure is valid to prevent white screen crashes
            Object.keys(mockDb).forEach(key => {
                const userData = mockDb[key];
                if (!userData.metrics) userData.metrics = [];
                if (!userData.observations) userData.observations = [];
                if (!userData.feelings) userData.feelings = [];
                if (!userData.sessions) userData.sessions = [];
                if (key === 'trainer01' && !userData.notifications) userData.notifications = [];
            });

            mockPublicAchievements = JSON.parse(publicAchievementsData!, reviver);
            mockPendingAchievements = JSON.parse(pendingAchievementsData!, reviver);
            mockChatMessages = JSON.parse(chatMessagesData!, reviver);
            dailyTrackers = JSON.parse(dailyTrackersData!, reviver);
            mockRedeemedRewards = JSON.parse(redeemedRewardsData!, reviver);
            mockRewardStock = JSON.parse(rewardStockData!, reviver);
            
            // NEW: Run sanitization to fix any malformed timestamps from previous sessions
            sanitizeData();
        } else {
            initDefaultData();
        }
    } catch (e) {
        console.error("Failed to parse data from localStorage. Resetting to default data.", e);
        initDefaultData();
    }
};

// --- DAILY LIMITS LOGIC ---
export function canPerformAction(userId: string, action: keyof typeof DAILY_LIMITS): boolean {
  const today = new Date().toISOString().split('T')[0];
  const tracker = dailyTrackers.find(t => t.userId === userId && t.date === today);
  if (!tracker) return true;
  const limit = DAILY_LIMITS[action];
  const currentCount = tracker.actions[action] || 0;
  return currentCount < limit;
}

export function incrementActionCount(userId: string, action: keyof typeof DAILY_LIMITS): void {
  const today = new Date().toISOString().split('T')[0];
  let tracker = dailyTrackers.find(t => t.userId === userId && t.date === today);
  if (!tracker) {
    tracker = { userId, date: today, actions: {} };
    dailyTrackers.push(tracker);
  }
  tracker.actions[action] = (tracker.actions[action] || 0) + 1;
  saveData();
}

export function cleanOldTrackers(): void {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
  dailyTrackers = dailyTrackers.filter(t => t.date >= cutoffDate);
  saveData();
}

// --- GAMIFICATION LOGIC ---
const calculateLevel = (totalPoints: number) => Math.floor(Math.sqrt(totalPoints / 100)) + 1;
const getPointsForLevel = (level: number) => (level - 1) ** 2 * 100;
const getPointsForNextLevel = (currentLevel: number) => currentLevel ** 2 * 100;

export const calculateLevelInfo = (totalPoints: number) => {
    const level = calculateLevel(totalPoints);
    const pointsForCurrentLevel = getPointsForLevel(level);
    const pointsForNextLevel = getPointsForNextLevel(level);
    const xpForLevelRange = pointsForNextLevel - pointsForCurrentLevel;
    const currentXpInLevel = totalPoints - pointsForCurrentLevel;
    const progress = xpForLevelRange > 0 ? (currentXpInLevel / xpForLevelRange) * 100 : 100;

    return { level, progress, currentXpInLevel, xpForNextLevel: xpForLevelRange };
};

function checkStreaks(user: UserProfile, context: { action: string, sessionDate?: Date }): { points: number, newBadges: Badge[] } {
    const rewards = { points: 0, newBadges: [] as Badge[] };
    const profile = user.gamification;

    if (context.action === 'BOOK_SESSION' && context.sessionDate) {
        const streak = profile.streaks.find(s => s.type === 'training');
        if (!streak) return rewards;

        const today = context.sessionDate;
        today.setHours(0,0,0,0);
        const lastUpdate = streak.lastUpdate.toDate();
        lastUpdate.setHours(0,0,0,0);
        
        const daysDiff = (today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) { // Consecutive days
            streak.current++;
        } else if (daysDiff > 1) { // Streak broken
            streak.current = 1;
        } else { // Same day booking, don't change streak
            return rewards;
        }

        if (streak.current > streak.best) streak.best = streak.current;
        streak.lastUpdate = mockTimestamp(today);

        const streakPointsKey = `STREAK_${streak.current}_DAYS` as keyof typeof POINT_REWARDS;
        if (POINT_REWARDS[streakPointsKey]) {
            rewards.points = POINT_REWARDS[streakPointsKey];
        }
        
        if (streak.current === 7 && !profile.badges.some(b => b.id === 'unstoppable-7')) {
            const badgeInfo = BADGES_CATALOG['unstoppable-7'];
            const newBadge: Badge = { id: 'unstoppable-7', ...badgeInfo, unlockedAt: mockTimestamp(new Date()) };
            profile.badges.push(newBadge);
            rewards.newBadges.push(newBadge);
        }
    }
    return rewards;
}

const checkSpecialBadges = (user: UserProfile, action: string, data: any): Badge[] => {
    const newBadges: Badge[] = [];
    const profile = user.gamification;
    const hasBadge = (id: string) => profile.badges.some(b => b.id === id);

    if (action === 'BOOK_SESSION' && !hasBadge('first-booking') && data.sessions.length === 1) {
        const badgeInfo = BADGES_CATALOG['first-booking'];
        newBadges.push({ id: 'first-booking', ...badgeInfo, unlockedAt: mockTimestamp(new Date()) });
    }
    if (action === 'POST_WORKOUT_SENSATION' && !hasBadge('feedback-pro-5') && data.feelings.length === 5) {
        const badgeInfo = BADGES_CATALOG['feedback-pro-5'];
        newBadges.push({ id: 'feedback-pro-5', ...badgeInfo, unlockedAt: mockTimestamp(new Date()) });
    }
    
    newBadges.forEach(b => profile.badges.push(b));
    return newBadges;
}

export function checkAndAwardPoints(userId: string, action: keyof typeof POINT_REWARDS, context: any = {}): PointsAwarded | null {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const user = mockUsers[userIndex];
    const profile = user.gamification;
    const oldLevel = profile.level;
    const awarded: PointsAwarded = { points: 0, newBadges: [], leveledUp: false, newLevel: oldLevel };

    // 1. Base Points
    let pointsGained = POINT_REWARDS[action] || 0;
    if (action === 'POST_WORKOUT_SENSATION' && context.isDetailed) {
        pointsGained += POINT_REWARDS.DETAILED_SENSATION;
    }
    profile.totalPoints += pointsGained;
    awarded.points = pointsGained;

    // 2. Streaks
    const streakRewards = checkStreaks(user, { action, sessionDate: context.sessionDate });
    profile.totalPoints += streakRewards.points;
    awarded.points += streakRewards.points;
    awarded.newBadges.push(...streakRewards.newBadges);

    // 3. Special Badges
    const specialBadges = checkSpecialBadges(user, action, mockDb[userId]);
    awarded.newBadges.push(...specialBadges);

    // 4. Update Level
    const newLevel = calculateLevel(profile.totalPoints);
    if (newLevel > oldLevel) {
        profile.level = newLevel;
        awarded.leveledUp = true;
        awarded.newLevel = newLevel;

        if (newLevel >= 5 && !profile.badges.some(b => b.id === 'level-5')) {
            const badgeInfo = BADGES_CATALOG['level-5'];
            const newBadge: Badge = { id: 'level-5', ...badgeInfo, unlockedAt: mockTimestamp(new Date()) };
            profile.badges.push(newBadge);
            awarded.newBadges.push(newBadge);
        }
    }
    const levelInfo = calculateLevelInfo(profile.totalPoints);
    profile.experience = levelInfo.currentXpInLevel;
    profile.experienceToNextLevel = levelInfo.xpForNextLevel;

    saveData();
    return awarded;
}

// --- REWARDS STORE LOGIC ---
export function getAvailableStock(rewardId: string): number | 'unlimited' {
    const reward = REWARD_CATALOG.find(r => r.id === rewardId);
    if (!reward) return 0;
    if (reward.stock === 'unlimited') return 'unlimited';
    const stockEntry = mockRewardStock.find(s => s.rewardId === rewardId);
    return stockEntry?.remaining ?? reward.stock;
}


// --- DATA MUTATION SERVICE FUNCTIONS ---
export const addUser = (newUser: UserProfile & { id: string }) => {
    mockUsers.push(newUser);
    if (!mockDb[newUser.id]) {
        mockDb[newUser.id] = { metrics: [], observations: [], feelings: [], sessions: [] };
    }
    saveData();
};

export const completeUserProfile = (userId: string, { displayName, birthDate }: { displayName: string, birthDate: string }) => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        mockUsers[userIndex].displayName = displayName;
        mockUsers[userIndex].birthDate = birthDate;
        mockUsers[userIndex].registrationCompleted = true;
        saveData();
    }
};

export const updateUserPlan = (userId: string, planName: string) => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        mockUsers[userIndex].plan = planName;
        saveData();
    }
};

export const addSession = (userId: string, session: Session) => {
    if (mockDb[userId]) {
        if (!mockDb[userId].sessions) mockDb[userId].sessions = [];
        mockDb[userId].sessions.push(session);
        return checkAndAwardPoints(userId, 'BOOK_SESSION', { sessionDate: new Date(session.date) });
    }
    return null;
};

export const replaceSession = (userId: string, oldSessionId: string, newSession: Session) => {
    if (mockDb[userId]) {
        if (!mockDb[userId].sessions) mockDb[userId].sessions = [];
        const updatedSessions = mockDb[userId].sessions.filter(s => s.id !== oldSessionId);
        updatedSessions.push(newSession);
        mockDb[userId].sessions = updatedSessions;
        saveData(); // No points for replacing
    }
};

export const addMetric = (userId: string, metric: Metric) => {
    if (mockDb[userId]) {
        if (!mockDb[userId].metrics) mockDb[userId].metrics = [];
        mockDb[userId].metrics.push(metric);
        saveData();
    }
};

export const addObservation = (userId: string, observation: Observation) => {
    if (mockDb[userId]) {
        if (!mockDb[userId].observations) mockDb[userId].observations = [];
        mockDb[userId].observations.push(observation);
        saveData();
    }
};

export const addFeeling = (userId: string, feeling: Feeling, isDetailed: boolean) => {
    if (mockDb[userId]) {
        if (!mockDb[userId].feelings) mockDb[userId].feelings = [];
        mockDb[userId].feelings.push(feeling);
        return checkAndAwardPoints(userId, 'POST_WORKOUT_SENSATION', { isDetailed });
    }
    return null;
};

export const addPendingAchievement = (achievement: any) => {
    mockPendingAchievements.push(achievement);
    saveData();
};

export const approvePendingAchievement = (id: string) => {
    const achievementToApprove = mockPendingAchievements.find(item => item.id === id);
    if (achievementToApprove) {
        mockPublicAchievements.push({
            id: `ach_${Date.now()}`,
            text: achievementToApprove.text,
            userEmail: achievementToApprove.userEmail,
            timestamp: mockTimestamp(new Date()),
        });
        mockPendingAchievements = mockPendingAchievements.filter(item => item.id !== id);
        return checkAndAwardPoints(achievementToApprove.userId, 'APPROVE_ACHIEVEMENT');
    }
    return null;
};

export const rejectPendingAchievement = (id: string) => {
    mockPendingAchievements = mockPendingAchievements.filter(item => item.id !== id);
    saveData();
};

export const addChatMessage = (chatId: string, message: any) => {
    if (!mockChatMessages[chatId]) {
        mockChatMessages[chatId] = [];
    }
    mockChatMessages[chatId].push(message);
    saveData();
};

export const registerAttendance = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return null;

    let totalPoints = POINT_REWARDS.CHECK_IN;
    let newBadges: Badge[] = [];

    if (user.birthDate && isBirthdayToday(user.birthDate)) {
        totalPoints += POINT_REWARDS.BIRTHDAY_CHECK_IN_BONUS;
    }
    
    const awarded = checkAndAwardPoints(userId, 'CHECK_IN', {});
    if(awarded && user.birthDate && isBirthdayToday(user.birthDate)){
        awarded.points += POINT_REWARDS.BIRTHDAY_CHECK_IN_BONUS;
        user.gamification.totalPoints += POINT_REWARDS.BIRTHDAY_CHECK_IN_BONUS;
    }
    
    return awarded;
};

const addTrainerNotification = (notification: { title: string, message: string }) => {
    if (!mockDb.trainer01) return; // Safety check
    if (!mockDb.trainer01.notifications) {
        mockDb.trainer01.notifications = [];
    }
    mockDb.trainer01.notifications.push({ ...notification, date: new Date().toISOString() });
    saveData();
};

export const checkAndApplyBirthdayBonus = (userId: string) => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    const user = mockUsers[userIndex];
    
    const currentYear = new Date().getFullYear();
    if (!user.birthDate || !isBirthdayToday(user.birthDate) || user.lastBirthdayBonusYear === currentYear) {
        return null;
    }

    user.lastBirthdayBonusYear = currentYear;
    user.gamification.totalPoints += POINT_REWARDS.BIRTHDAY_BONUS;

    const hasBadge = user.gamification.badges.some(b => b.id === 'birthday-badge');
    let newBadge: Badge | null = null;
    if (!hasBadge) {
        const badgeInfo = BADGES_CATALOG['birthday-badge'];
        newBadge = { id: 'birthday-badge', ...badgeInfo, unlockedAt: mockTimestamp(new Date()) };
        user.gamification.badges.push(newBadge);
    }
    
    addTrainerNotification({
        title: `🎂 Cumpleaños de ${user.displayName || user.username}`,
        message: `Hoy es el cumpleaños de ${user.displayName || user.username}. ¡Considera enviarle un saludo!`
    });

    const awarded: PointsAwarded = {
        points: POINT_REWARDS.BIRTHDAY_BONUS,
        newBadges: newBadge ? [newBadge] : [],
        leveledUp: false,
        newLevel: user.gamification.level
    };

    // Recalculate level after adding points
    const oldLevel = user.gamification.level;
    const newLevel = calculateLevel(user.gamification.totalPoints);
    if(newLevel > oldLevel) {
        user.gamification.level = newLevel;
        awarded.leveledUp = true;
        awarded.newLevel = newLevel;
    }

    saveData();
    return awarded;
};

export const updateUserProfile = (userId: string, data: Partial<Pick<UserProfile, 'displayName' | 'birthDate' | 'photoURL'>>) => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
        saveData();
        return mockUsers[userIndex];
    }
    return null;
};


// Initialize data on load
loadData();
cleanOldTrackers();
