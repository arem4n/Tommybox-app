import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, addDoc, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, DailyActionTracker, Badge, Achievement } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const DAILY_LIMITS = {
  POST_WORKOUT_SENSATION: 1,
  CHECK_IN: 1,
};

const POINTS_MAP = {
  POST_WORKOUT_SENSATION: 5,
  DETAILED_FEEDBACK: 10,
  CHECK_IN: 10,
};

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

export async function checkAndAwardPoints(userId: string, action: string, context?: any): Promise<any> {
    if (!db) return null;
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;

        const userProfile = userSnap.data() as UserProfile;
        const gamification = userProfile.gamification || {
            userId, totalPoints: 0, level: 1, experience: 0, experienceToNextLevel: 100, badges: [], achievements: [], streaks: []
        };

        let pointsToAward = 0;
        let message = '';

        if (action === 'POST_WORKOUT_SENSATION') {
            pointsToAward = POINTS_MAP.POST_WORKOUT_SENSATION;
            message = `¡Feedback registrado! +${pointsToAward} XP`;
            if (context?.isDetailed) {
                pointsToAward += POINTS_MAP.DETAILED_FEEDBACK;
                message = `¡Feedback detallado! +${pointsToAward} XP`;
            }
        } else if (action === 'CHECK_IN') {
            pointsToAward = POINTS_MAP.CHECK_IN;
            message = `¡Check-in exitoso! +${pointsToAward} XP`;
        }

        if (pointsToAward > 0) {
            gamification.totalPoints += pointsToAward;
            
            // Level up logic (simplified for now, relying on calculateLevelInfo for display)
            
            await updateDoc(userRef, { gamification });
            return { points: pointsToAward, message, newBadges: [] };
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
        return null;
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
