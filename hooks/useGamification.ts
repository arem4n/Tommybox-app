import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  canPerformAction,
  incrementActionCount,
  recalculateGamification,
} from '../services/gamification';
import { GamificationProfile } from '../types';
import { AppUser } from '../types';

export interface RegisterFeelingParams {
  feeling: string;
  comment?: string;
  recoveryNotes?: string;
}

export interface RegisterFeelingResult {
  ok: boolean;
  error?: string;
  xpGained?: number;
}

/** XP bonus por nivel de esfuerzo/sensación */
const EFFORT_BONUS: Record<string, number> = {
  'Excelente': 10,
  'Bien': 5,
  'Normal': 0,
  'Cansado': 0,
  'Muy duro': 5,
};

/**
 * Custom hook that manages gamification state and the post-workout feeling registration.
 * Extracts all Firestore subscriptions and mutations from GamificationView.
 */
export const useGamification = (user: AppUser | null) => {
  const [gamification, setGamification] = useState<GamificationProfile | null>(
    user?.gamification ?? null
  );
  const [monthSessions, setMonthSessions] = useState(0);
  const [canRegisterFeeling, setCanRegisterFeeling] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<{
    icon: string;
    name: string;
    rarity: string;
  } | null>(null);

  // ── Helper: persist seen badge IDs in localStorage ──
  const getStoredBadgeIds = useCallback((): Set<string> => {
    try {
      const raw = localStorage.getItem(`tb_badges_${user?.id}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, [user?.id]);

  const storeBadgeIds = useCallback(
    (ids: Set<string>) => {
      try {
        localStorage.setItem(`tb_badges_${user?.id}`, JSON.stringify([...ids]));
      } catch {}
    },
    [user?.id]
  );

  // ── Listen to gamification doc on user profile ──
  useEffect(() => {
    if (!user?.id || !db) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.gamification) {
          const newGam: GamificationProfile = data.gamification;
          const incoming = new Set((newGam.badges || []).map((b: any) => b.id as string));
          const stored = getStoredBadgeIds();

          // Show popup only for genuinely new badges
          if (stored.size > 0) {
            for (const badge of newGam.badges || []) {
              if (!stored.has(badge.id)) {
                setNewlyUnlockedBadge({ icon: badge.icon, name: badge.name, rarity: badge.rarity });
                setTimeout(() => setNewlyUnlockedBadge(null), 6000);
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
  }, [user?.id, getStoredBadgeIds, storeBadgeIds]);

  // ── Listen to current month session count ──
  useEffect(() => {
    if (!user?.id || !db) return;
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const q = query(
      collection(db, `agenda/${user.id}/events`),
      where('date', '>=', `${monthPrefix}-01`),
      where('date', '<=', `${monthPrefix}-31`)
    );
    const unsub = onSnapshot(q, (snap) => setMonthSessions(snap.size));
    return () => unsub();
  }, [user?.id]);

  // ── Check if user can register feeling today ──
  useEffect(() => {
    if (!user?.id) return;
    canPerformAction(user.id, 'POST_WORKOUT_SENSATION').then(setCanRegisterFeeling);
  }, [user?.id]);

  // ── Register post-workout feeling ──
  const registerFeeling = async (params: RegisterFeelingParams): Promise<RegisterFeelingResult> => {
    if (!user?.id || !db) return { ok: false, error: 'No autenticado' };
    const effortBonus = EFFORT_BONUS[params.feeling] ?? 0;
    const xpGained = 5 + effortBonus;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'users', user.id, 'feelings'), {
        feeling: params.feeling,
        comment: params.comment ?? '',
        recoveryNotes: params.recoveryNotes ?? '',
        date: todayStr,
        effortBonus,
        timestamp: Timestamp.now(),
      });
      await incrementActionCount(user.id, 'POST_WORKOUT_SENSATION');
      // Client-side gamification call (complement — CF also triggers)
      // await recalculateGamification(user.id); // Removed: handled by Cloud Function
      setCanRegisterFeeling(false);
      return { ok: true, xpGained };
    } catch (e) {
      console.error('registerFeeling failed:', e);
      return { ok: false, error: 'Error al registrar sensación' };
    }
  };

  return {
    gamification,
    monthSessions,
    canRegisterFeeling,
    newlyUnlockedBadge,
    dismissBadge: () => setNewlyUnlockedBadge(null),
    registerFeeling,
  };
};
