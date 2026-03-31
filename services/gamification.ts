import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, addDoc, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, DailyActionTracker, Badge, Achievement, Streak } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const DAILY_LIMITS = {
  POST_WORKOUT_SENSATION: 1,
  CHECK_IN: 1,
};

export const BADGE_CATALOG: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'primer_rep', name: 'Primer Rep', description: 'Realiza tu primera sesión de entrenamiento', icon: '🎯', rarity: 'common', category: 'consistency' },
  { id: 'asistencia_10', name: 'Constante', description: 'Completa 10 sesiones de entrenamiento', icon: '⭐', rarity: 'rare', category: 'consistency' },
  { id: 'asistencia_25', name: 'Dedicado', description: 'Completa 25 sesiones de entrenamiento', icon: '🌟', rarity: 'epic', category: 'consistency' },
  { id: 'asistencia_50', name: 'Imparable', description: 'Completa 50 sesiones de entrenamiento', icon: '👑', rarity: 'legendary', category: 'consistency' },
  { id: 'feedback_5', name: 'Atento', description: 'Registra tu sensación post-entreno 5 veces', icon: '📝', rarity: 'common', category: 'feedback' },
  { id: 'feedback_20', name: 'Analítico', description: 'Registra tu sensación post-entreno 20 veces', icon: '📊', rarity: 'rare', category: 'feedback' },
  { id: 'racha_3', name: 'En Racha', description: 'Mantén una racha de 3 semanas', icon: '🔥', rarity: 'common', category: 'consistency' },
  { id: 'racha_8', name: 'Fuego Interno', description: 'Mantén una racha de 8 semanas', icon: '☄️', rarity: 'rare', category: 'consistency' },
  { id: 'racha_16', name: 'Volcán', description: 'Mantén una racha de 16 semanas', icon: '🌋', rarity: 'epic', category: 'consistency' },
  { id: 'cumpleanos', name: 'Regalo de Cumpleaños', description: 'Entrena el día de tu cumpleaños', icon: '🎂', rarity: 'rare', category: 'special' },
];

export const ACHIEVEMENT_CATALOG: Achievement[] = [
  { id: 'ach_asistencia_10', text: '10 Sesiones', title: '10 Sesiones', description: 'Has completado tus primeras 10 sesiones', points: 50, total: 10, type: 'attendance', userEmail: '', timestamp: Timestamp.now() },
  { id: 'ach_asistencia_25', text: '25 Sesiones', title: '25 Sesiones', description: 'Has completado 25 sesiones', points: 150, total: 25, type: 'attendance', userEmail: '', timestamp: Timestamp.now() },
  { id: 'ach_feedback_5', text: '5 Sensaciones', title: '5 Sensaciones', description: 'Has registrado 5 sensaciones post-entreno', points: 25, total: 5, type: 'feedback', userEmail: '', timestamp: Timestamp.now() },
  { id: 'ach_feedback_20', text: '20 Sensaciones', title: '20 Sensaciones', description: 'Has registrado 20 sensaciones post-entreno', points: 75, total: 20, type: 'feedback', userEmail: '', timestamp: Timestamp.now() },
  { id: 'ach_racha_3', text: 'Racha de 3 Semanas', title: 'Racha de 3 Semanas', description: 'Has mantenido una racha de 3 semanas', points: 30, total: 3, type: 'consistency', userEmail: '', timestamp: Timestamp.now() },
  { id: 'ach_racha_8', text: 'Racha de 8 Semanas', title: 'Racha de 8 Semanas', description: 'Has mantenido una racha de 8 semanas', points: 100, total: 8, type: 'consistency', userEmail: '', timestamp: Timestamp.now() },
];

const RARITY_POINTS = {
  common: 10,
  rare: 25,
  epic: 75,
  legendary: 200,
};

// Helper: Get Monday of the week for a given date string (YYYY-MM-DD)
const getMonday = (dateString: string) => {
  const d = new Date(dateString);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

export async function recalculateGamification(userId: string): Promise<void> {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userProfile = userSnap.data() as UserProfile;

    const eventsRef = collection(db, `agenda/${userId}/events`);
    const todayStr = new Date().toISOString().split('T')[0];

    // Get all past and present events
    const qEvents = query(eventsRef, where('date', '<=', todayStr));
    const eventsSnap = await getDocs(qEvents);
    const sessionDates = eventsSnap.docs.map(d => d.data().date as string).sort();

    const feelingsRef = collection(db, `users/${userId}/feelings`);
    const feelingsSnap = await getDocs(feelingsRef);
    const totalFeelings = feelingsSnap.size;

    const totalSessions = sessionDates.length;

    // Calculate Streak
    const weeksWithSessions = new Set<string>();
    for (const date of sessionDates) {
      weeksWithSessions.add(getMonday(date));
    }
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
        const prevW = new Date(sortedWeeks[i - 1]);
        const currW = new Date(sortedWeeks[i]);
        const diffTime = Math.abs(currW.getTime() - prevW.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 7) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > maxTempStreak) maxTempStreak = tempStreak;
      }
      bestStreak = maxTempStreak;

      const lastSessionWeek = sortedWeeks[sortedWeeks.length - 1];
      if (lastSessionWeek === todayMonday || lastSessionWeek === lastWeekMonday) {
        // Calculate current streak backwards from lastSessionWeek
        currentStreak = 1;
        for (let i = sortedWeeks.length - 1; i > 0; i--) {
            const currW = new Date(sortedWeeks[i]);
            const prevW = new Date(sortedWeeks[i-1]);
            const diffTime = Math.abs(currW.getTime() - prevW.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 7) {
                currentStreak++;
            } else {
                break;
            }
        }
      } else {
        currentStreak = 0;
      }
    }

    const streaks: Streak[] = [{ type: 'training', current: currentStreak, best: bestStreak, lastUpdate: Timestamp.now() }];

    // Achievements calculation
    const achievements: Achievement[] = ACHIEVEMENT_CATALOG.map(catAch => {
      let progress = 0;
      if (catAch.id.includes('asistencia')) progress = Math.min(totalSessions, catAch.total!);
      if (catAch.id.includes('feedback')) progress = Math.min(totalFeelings, catAch.total!);
      if (catAch.id.includes('racha')) progress = Math.min(currentStreak, catAch.total!);

      const completed = progress >= catAch.total!;
      return {
        ...catAch,
        progress,
        completed,
        completedAt: completed ? Timestamp.now() : undefined,
        userEmail: userProfile.email
      };
    });

    let achievementPoints = 0;
    for (const ach of achievements) {
      if (ach.completed) achievementPoints += ach.points || 0;
    }

    // Badges calculation
    const newBadges: Badge[] = [];

    // Check old badges to keep their unlockedAt timestamp
    const existingBadgesMap = new Map((userProfile.gamification?.badges || []).map(b => [b.id, b]));

    const checkAndAddBadge = (id: string, condition: boolean) => {
      if (condition) {
        const catalogBadge = BADGE_CATALOG.find(b => b.id === id);
        if (catalogBadge) {
           const existing = existingBadgesMap.get(id);
           newBadges.push({
             ...catalogBadge,
             unlockedAt: existing ? existing.unlockedAt : Timestamp.now()
           });
        }
      }
    };

    checkAndAddBadge('primer_rep', totalSessions >= 1);
    checkAndAddBadge('asistencia_10', totalSessions >= 10);
    checkAndAddBadge('asistencia_25', totalSessions >= 25);
    checkAndAddBadge('asistencia_50', totalSessions >= 50);
    checkAndAddBadge('feedback_5', totalFeelings >= 5);
    checkAndAddBadge('feedback_20', totalFeelings >= 20);
    checkAndAddBadge('racha_3', currentStreak >= 3);
    checkAndAddBadge('racha_8', currentStreak >= 8);
    checkAndAddBadge('racha_16', currentStreak >= 16);

    let hadBirthdayTraining = false;
    if (userProfile.birthDate) {
      const bMonthDay = userProfile.birthDate.substring(5);
      hadBirthdayTraining = sessionDates.some(d => d.substring(5) === bMonthDay);
    }
    checkAndAddBadge('cumpleanos', hadBirthdayTraining);

    let badgePoints = 0;
    for (const badge of newBadges) {
      badgePoints += RARITY_POINTS[badge.rarity] || 0;
    }

    // Points calculation (idempotent)
    const basePoints = (totalSessions * 10) + (totalFeelings * 5);
    const totalPoints = basePoints + achievementPoints + badgePoints;

    const levelInfo = calculateLevelInfo(totalPoints);

    const gamificationProfile = {
      userId,
      totalPoints,
      level: levelInfo.level,
      experience: levelInfo.currentXpInLevel,
      experienceToNextLevel: levelInfo.xpForNextLevel,
      badges: newBadges,
      achievements,
      streaks
    };

    await updateDoc(userRef, { gamification: gamificationProfile });

  } catch (error) {
    console.error("Error recalculating gamification", error);
    // Don't throw, just log
  }
}

export async function canPerformAction(userId: string, action: keyof typeof DAILY_LIMITS): Promise<boolean> {
  if (!db) return false;
  const today = new Date().toISOString().split('T')[0];
  try {
    const docRef = doc(db, `users/${userId}/dailyTrackers`, today);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return true;
    
    const tracker = docSnap.data() as DailyActionTracker;
    const limit = DAILY_LIMITS[action];
    const currentCount = tracker.actions?.[action] || 0;
    return currentCount < limit;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/dailyTrackers/${today}`);
    return false;
  }
}

export async function incrementActionCount(userId: string, action: keyof typeof DAILY_LIMITS): Promise<void> {
  if (!db) return;
  const today = new Date().toISOString().split('T')[0];
  try {
    const docRef = doc(db, `users/${userId}/dailyTrackers`, today);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const tracker = docSnap.data() as DailyActionTracker;
      const currentCount = tracker.actions?.[action] || 0;
      await updateDoc(docRef, {
        [`actions.${action}`]: currentCount + 1
      });
    } else {
      await setDoc(docRef, {
        userId,
        date: today,
        actions: { [action]: 1 }
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/dailyTrackers/${today}`);
  }
}

export function subscribeToPendingAchievements(callback: (achievements: any[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, 'pendingAchievements'));
  return onSnapshot(q, (snapshot) => {
    const achievements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(achievements);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'pendingAchievements');
  });
}

export async function addPendingAchievement(data: any) {
  if (!db) return;
  try {
    await addDoc(collection(db, 'pendingAchievements'), {
      ...data,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'pendingAchievements');
  }
}

export async function approvePendingAchievement(id: string) {
  if (!db) return;
  try {
    const docRef = doc(db, 'pendingAchievements', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      await addDoc(collection(db, 'publicAchievements'), data);
      await deleteDoc(docRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `pendingAchievements/${id}`);
  }
}

export async function rejectPendingAchievement(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'pendingAchievements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `pendingAchievements/${id}`);
  }
}

// --- REWARDS ---

export async function redeemReward(userId: string, reward: any, type: 'points' | 'cash') {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, message: 'User not found' };

    const userProfile = userSnap.data() as UserProfile;
    const gamification = userProfile.gamification || {
        userId, totalPoints: 0, level: 1, experience: 0, experienceToNextLevel: 100, badges: [], achievements: [], streaks: []
    };

    if (type === 'points' && gamification.totalPoints < reward.pointsCost) {
      return { success: false, message: 'Puntos insuficientes' };
    }

    if (type === 'points') {
      gamification.totalPoints -= reward.pointsCost;
      await updateDoc(userRef, { gamification });
    }

    const redemptionData = {
      userId,
      rewardId: reward.id,
      rewardName: reward.name,
      type,
      pointsSpent: type === 'points' ? reward.pointsCost : 0,
      pricePaid: type === 'cash' ? reward.price : 0,
      status: 'pending',
      redeemedAt: Timestamp.now()
    };

    await addDoc(collection(db, 'redemptions'), redemptionData);

    return { 
      success: true, 
      message: type === 'points' ? '¡Canje exitoso!' : 'Procesando pago...',
      redemption: redemptionData
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'redemptions');
    return { success: false, message: 'Error al procesar el canje' };
  }
}

export function subscribeToUserRedemptions(userId: string, callback: (redemptions: any[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, 'redemptions'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const redemptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(redemptions);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'redemptions');
  });
}

export function subscribeToAllRedemptions(callback: (redemptions: any[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, 'redemptions'));
  return onSnapshot(q, (snapshot) => {
    const redemptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(redemptions);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'redemptions');
  });
}

// Keep this pure function here for easy access
export const calculateLevelInfo = (totalPoints: number) => {
    const calculateLevel = (points: number) => Math.floor(Math.sqrt(points / 100)) + 1;
    const getPointsForLevel = (level: number) => Math.pow(level - 1, 2) * 100;
    const getPointsForNextLevel = (level: number) => Math.pow(level, 2) * 100;

    const level = calculateLevel(totalPoints);
    const pointsForCurrentLevel = getPointsForLevel(level);
    const pointsForNextLevel = getPointsForNextLevel(level);
    const xpForLevelRange = pointsForNextLevel - pointsForCurrentLevel;
    const currentXpInLevel = totalPoints - pointsForCurrentLevel;
    const progress = xpForLevelRange > 0 ? (currentXpInLevel / xpForLevelRange) * 100 : 100;

    return { level, progress, currentXpInLevel, xpForNextLevel: xpForLevelRange };
};
