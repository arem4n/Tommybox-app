import {
  DocumentData,
  DocumentReference,
  Firestore,
  Timestamp,
} from 'firebase-admin/firestore';

interface UserProfile {
  email: string;
  birthDate?: string;
  gamification?: any;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  description: string;
  unlockedAt: Timestamp;
}

const BADGE_CATALOG: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'primer_rep', name: 'Primer Rep', description: 'Realiza tu primera sesión de entrenamiento', icon: '🎯', rarity: 'common', category: 'consistency' },
  { id: 'asistencia_10', name: 'Constante', description: 'Completa 10 sesiones de entrenamiento', icon: '⭐', rarity: 'rare', category: 'consistency' },
  { id: 'asistencia_25', name: 'Dedicado', description: 'Completa 25 sesiones de entrenamiento', icon: '🌟', rarity: 'epic', category: 'consistency' },
  { id: 'asistencia_50', name: 'Imparable', description: 'Completa 50 sesiones de entrenamiento', icon: '👑', rarity: 'legendary', category: 'consistency' },
  { id: 'feedback_5', name: 'Atento', description: 'Registra tu sensación post-entreno 5 veces', icon: '📝', rarity: 'common', category: 'milestone' },
  { id: 'feedback_20', name: 'Analítico', description: 'Registra tu sensación post-entreno 20 veces', icon: '📊', rarity: 'rare', category: 'milestone' },
  { id: 'racha_3', name: 'En Racha', description: 'Mantén una racha de 3 semanas', icon: '🔥', rarity: 'common', category: 'consistency' },
  { id: 'racha_8', name: 'Fuego Interno', description: 'Mantén una racha de 8 semanas', icon: '☄️', rarity: 'rare', category: 'consistency' },
  { id: 'racha_16', name: 'Volcán', description: 'Mantén una racha de 16 semanas', icon: '🌋', rarity: 'epic', category: 'consistency' },
  { id: 'cumpleanos', name: 'Regalo de Cumpleaños', description: 'Entrena el día de tu cumpleaños', icon: '🎂', rarity: 'rare', category: 'special' },
];

const RARITY_POINTS: Record<string, number> = { common: 10, rare: 25, epic: 75, legendary: 200 };

const ACHIEVEMENT_CATALOG = [
  { id: 'ach_asistencia_10', title: '10 Sesiones', points: 50, total: 10, type: 'attendance' },
  { id: 'ach_asistencia_25', title: '25 Sesiones', points: 150, total: 25, type: 'attendance' },
  { id: 'ach_feedback_5', title: '5 Sensaciones', points: 25, total: 5, type: 'feedback' },
  { id: 'ach_feedback_20', title: '20 Sensaciones', points: 75, total: 20, type: 'feedback' },
  { id: 'ach_racha_3', title: 'Racha de 3 Semanas', points: 30, total: 3, type: 'consistency' },
  { id: 'ach_racha_8', title: 'Racha de 8 Semanas', points: 100, total: 8, type: 'consistency' },
];

const getMonday = (dateString: string): string => {
  const d = new Date(dateString);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

const calculateLevelInfo = (totalPoints: number) => {
  const level = Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  const pointsForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const pointsForNextLevel = Math.pow(level, 2) * 100;
  const xpForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
  const currentXpInLevel = totalPoints - pointsForCurrentLevel;
  const progress = xpForNextLevel > 0 ? (currentXpInLevel / xpForNextLevel) * 100 : 100;
  return { level, progress, currentXpInLevel, xpForNextLevel };
};

/**
 * Server-side gamification recalculation.
 * Mirror of the client-side logic in services/gamification.ts.
 * Runs as the authoritative complement to the client call.
 */
export async function recalculateGamificationServer(
  db: Firestore,
  userId: string
): Promise<void> {
  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const userProfile = userSnap.data() as UserProfile;

  const todayStr = new Date().toISOString().split('T')[0];
  const eventsSnap = await db
    .collection(`agenda/${userId}/events`)
    .where('date', '<=', todayStr)
    .get();
  const sessionDates = eventsSnap.docs.map((d) => d.data().date as string).sort();

  const feelingsSnap = await db.collection(`users/${userId}/feelings`).get();
  const totalFeelings = feelingsSnap.size;
  const totalSessions = sessionDates.length;

  // Streak calculation
  const weeksWithSessions = new Set<string>(sessionDates.map(getMonday));
  const sortedWeeks = Array.from(weeksWithSessions).sort();

  let currentStreak = 0;
  let bestStreak = 0;

  if (sortedWeeks.length > 0) {
    const todayMonday = getMonday(todayStr);
    const lastWeekDate = new Date(todayMonday);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekMonday = lastWeekDate.toISOString().split('T')[0];

    let tempStreak = 1;
    let maxTempStreak = 1;
    for (let i = 1; i < sortedWeeks.length; i++) {
      const diff = Math.ceil(
        Math.abs(new Date(sortedWeeks[i]).getTime() - new Date(sortedWeeks[i - 1]).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      tempStreak = diff === 7 ? tempStreak + 1 : 1;
      if (tempStreak > maxTempStreak) maxTempStreak = tempStreak;
    }
    bestStreak = maxTempStreak;

    const lastSessionWeek = sortedWeeks[sortedWeeks.length - 1];
    if (lastSessionWeek === todayMonday || lastSessionWeek === lastWeekMonday) {
      currentStreak = 1;
      for (let i = sortedWeeks.length - 1; i > 0; i--) {
        const diff = Math.ceil(
          Math.abs(new Date(sortedWeeks[i]).getTime() - new Date(sortedWeeks[i - 1]).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (diff === 7) currentStreak++;
        else break;
      }
    }
  }

  // Achievements
  const existingBadgesMap = new Map<string, Badge>(
    (userProfile.gamification?.badges || []).map((b: Badge) => [b.id, b])
  );

  const newBadges: Badge[] = [];
  const addBadge = (id: string, condition: boolean) => {
    if (!condition) return;
    const cat = BADGE_CATALOG.find((b) => b.id === id);
    if (!cat) return;
    const existing = existingBadgesMap.get(id);
    newBadges.push({ ...cat, unlockedAt: existing ? existing.unlockedAt : Timestamp.now() });
  };

  addBadge('primer_rep', totalSessions >= 1);
  addBadge('asistencia_10', totalSessions >= 10);
  addBadge('asistencia_25', totalSessions >= 25);
  addBadge('asistencia_50', totalSessions >= 50);
  addBadge('feedback_5', totalFeelings >= 5);
  addBadge('feedback_20', totalFeelings >= 20);
  addBadge('racha_3', currentStreak >= 3);
  addBadge('racha_8', currentStreak >= 8);
  addBadge('racha_16', currentStreak >= 16);

  let hadBirthdayTraining = false;
  if (userProfile.birthDate) {
    const bMonthDay = userProfile.birthDate.substring(5);
    hadBirthdayTraining = sessionDates.some((d) => d.substring(5) === bMonthDay);
  }
  addBadge('cumpleanos', hadBirthdayTraining);

  const achievements = ACHIEVEMENT_CATALOG.map((cat) => {
    let progress = 0;
    if (cat.type === 'attendance') progress = Math.min(totalSessions, cat.total);
    if (cat.type === 'feedback') progress = Math.min(totalFeelings, cat.total);
    if (cat.type === 'consistency') progress = Math.min(currentStreak, cat.total);
    const completed = progress >= cat.total;
    return { ...cat, progress, completed, userEmail: userProfile.email, text: cat.title, timestamp: Timestamp.now() };
  });

  const achievementPoints = achievements.reduce((acc, a) => acc + (a.completed ? a.points : 0), 0);
  const badgePoints = newBadges.reduce((acc, b) => acc + (RARITY_POINTS[b.rarity] || 0), 0);
  const basePoints = totalSessions * 10 + totalFeelings * 5;
  const totalPoints = basePoints + achievementPoints + badgePoints;

  const levelInfo = calculateLevelInfo(totalPoints);

  await userRef.update({
    gamification: {
      userId,
      totalPoints,
      level: levelInfo.level,
      experience: levelInfo.currentXpInLevel,
      experienceToNextLevel: levelInfo.xpForNextLevel,
      badges: newBadges,
      achievements,
      streaks: [{ type: 'training', current: currentStreak, best: bestStreak, lastUpdate: Timestamp.now() }],
    },
  });
}
