import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { SessionType } from '../types';
import {
  collection,
  query,
  onSnapshot,
  doc,
  Timestamp,
  collectionGroup,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { getPlanLimit } from '../utils/plans';
import { recalculateGamification } from '../services/gamification';
import { AppUser } from '../types';

export interface BookedSession {
  id: string;
  date: string;
  time: string;
  clientName?: string;
  userId?: string;
  isRecurring?: boolean;
  sessionType?: SessionType;
  createdAt?: any;
}

export interface TakenSlots {
  [key: string]: boolean;
}

export interface BookingResult {
  ok: boolean;
  error?: string;
  /** For recurring bookings: how many weeks were successfully booked */
  successfulBookings?: number;
  totalWeeks?: number;
}

interface ConfirmParams {
  sessionDay: number;
  sessionTime: string;
  startOfWeek: Date;
  isRecurring?: boolean;
  sessionType?: SessionType;
}

interface CancelParams {
  existingSessionId: string;
  sessionDay: number;
  sessionTime: string;
  startOfWeek: Date;
  /** For trainer cancellations — whose agenda to delete from */
  targetUserId?: string;
}

interface ModifyParams {
  existingSessionId: string;
  sessionDay: number;
  sessionTime: string;
  newTime: string;
  startOfWeek: Date;
  /** For trainer modifications */
  targetUserId?: string;
}

/**
 * Custom hook that manages all Firestore data and mutations for the agenda calendar.
 * Components using this hook stay free of Firestore implementation details.
 */
export const useAgenda = (user: AppUser | null) => {
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [takenSlots, setTakenSlots] = useState<TakenSlots>({});

  const isTrainer = user?.isTrainer ?? false;

  // ── Listen to all booked slots (for taken/free display) ──
  useEffect(() => {
    const q = query(collection(db!, 'bookedSlots'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taken: TakenSlots = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        taken[`${data.date}_${data.time}`] = true;
      });
      setTakenSlots(taken);
    });
    return () => unsubscribe();
  }, []);

  // ── Listen to sessions (all users for trainer, own for client) ──
  useEffect(() => {
    if (!user?.id) return;

    if (isTrainer) {
      const q = collectionGroup(db!, 'events');
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const allSessions: BookedSession[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const parentPath = docSnap.ref.parent.path;
          const match = parentPath.match(/agenda\/([^/]+)\/events/);
          const uid = match ? match[1] : '';

          let clientName = 'Atleta';
          if (uid) {
            try {
              const userSnap = await getDoc(doc(db!, 'users', uid));
              if (userSnap.exists()) {
                clientName = (userSnap.data() as any).displayName || 'Atleta';
              }
            } catch (_) {}
          }

          allSessions.push({ id: docSnap.id, clientName, userId: uid, ...data } as BookedSession);
        }
        setBookedSessions(allSessions);
      });
      return () => unsubscribe();
    } else {
      const q = query(collection(db!, `agenda/${user.id}/events`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setBookedSessions(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BookedSession))
        );
      });
      return () => unsubscribe();
    }
  }, [user?.id, isTrainer]);

  // ── Derived helpers ──
  const getSessionsInWeek = (weekStart: Date): number => {
    if (isTrainer) return 0;
    const startStr = weekStart.toISOString().split('T')[0];
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const endStr = endOfWeek.toISOString().split('T')[0];
    return bookedSessions.filter((s) => s.date >= startStr && s.date <= endStr).length;
  };

  const getWeeklyLimit = (): number => getPlanLimit(user?.plan);

  // ── Mutations ──

  const confirmBooking = async (params: ConfirmParams): Promise<BookingResult> => {
    if (!user?.id) return { ok: false, error: 'No user' };
    const { sessionDay, sessionTime, startOfWeek, isRecurring = false } = params;
    const weeksToBook = isRecurring ? 4 : 1;
    let successfulBookings = 0;

    try {
      for (let i = 0; i < weeksToBook; i++) {
        const slotDate = new Date(startOfWeek);
        slotDate.setDate(slotDate.getDate() + sessionDay + i * 7);
        const dateStr = slotDate.toISOString().split('T')[0];
        const slotId = `${dateStr}_${sessionTime.replace(':', '-')}`;

        if (i > 0 && takenSlots[slotId]) continue;

        const batch = writeBatch(db!);
        const eventRef = doc(collection(db!, `agenda/${user.id}/events`));
        batch.set(eventRef, {
          date: dateStr,
          time: sessionTime,
          createdAt: Timestamp.now(),
          isRecurring,
          sessionType: params.sessionType ?? 'Fuerza',
        });
        const slotRef = doc(db!, 'bookedSlots', slotId);
        batch.set(slotRef, {
          date: dateStr,
          time: sessionTime,
          bookedBy: user.id,
          createdAt: Timestamp.now(),
        });
        await batch.commit();
        successfulBookings++;
      }

      // Client-side gamification call (complement — CF also triggers server-side)
      recalculateGamification(user.id).catch(console.error);

      return { ok: true, successfulBookings, totalWeeks: weeksToBook };
    } catch (e) {
      console.error('confirmBooking failed:', e);
      return { ok: false, error: 'Error al agendar la sesión' };
    }
  };

  const cancelBooking = async (params: CancelParams): Promise<BookingResult> => {
    const targetUserId = params.targetUserId ?? user?.id;
    if (!targetUserId || !params.existingSessionId) return { ok: false, error: 'Datos insuficientes' };

    const slotDate = new Date(params.startOfWeek);
    slotDate.setDate(slotDate.getDate() + params.sessionDay);
    const dateStr = slotDate.toISOString().split('T')[0];
    const slotId = `${dateStr}_${params.sessionTime.replace(':', '-')}`;

    try {
      const batch = writeBatch(db!);
      batch.delete(doc(db!, `agenda/${targetUserId}/events`, params.existingSessionId));
      batch.delete(doc(db!, 'bookedSlots', slotId));
      await batch.commit();

      // Complement: also trigger client-side recalculation
      recalculateGamification(targetUserId).catch(console.error);

      return { ok: true };
    } catch (e) {
      console.error('cancelBooking failed:', e);
      return { ok: false, error: 'Error al cancelar la sesión' };
    }
  };

  const modifyBooking = async (params: ModifyParams): Promise<BookingResult> => {
    const targetUserId = params.targetUserId ?? user?.id;
    if (!targetUserId || !params.existingSessionId) return { ok: false, error: 'Datos insuficientes' };
    if (params.newTime === params.sessionTime) return { ok: true };

    const slotDate = new Date(params.startOfWeek);
    slotDate.setDate(slotDate.getDate() + params.sessionDay);
    const dateStr = slotDate.toISOString().split('T')[0];
    const oldSlotId = `${dateStr}_${params.sessionTime.replace(':', '-')}`;
    const newSlotId = `${dateStr}_${params.newTime.replace(':', '-')}`;

    if (takenSlots[newSlotId]) {
      return { ok: false, error: 'Ese horario ya está reservado. Elige otro.' };
    }

    try {
      const batch = writeBatch(db!);
      batch.delete(doc(db!, `agenda/${targetUserId}/events`, params.existingSessionId));
      batch.delete(doc(db!, 'bookedSlots', oldSlotId));
      const newEventRef = doc(collection(db!, `agenda/${targetUserId}/events`));
      batch.set(newEventRef, { date: dateStr, time: params.newTime, createdAt: Timestamp.now(), isRecurring: false });
      const newSlotRef = doc(db!, 'bookedSlots', newSlotId);
      batch.set(newSlotRef, { date: dateStr, time: params.newTime, bookedBy: targetUserId, createdAt: Timestamp.now() });
      await batch.commit();
      return { ok: true };
    } catch (e) {
      console.error('modifyBooking failed:', e);
      return { ok: false, error: 'Error al modificar la sesión' };
    }
  };

  return {
    bookedSessions,
    takenSlots,
    getSessionsInWeek,
    getWeeklyLimit,
    confirmBooking,
    cancelBooking,
    modifyBooking,
  };
};
