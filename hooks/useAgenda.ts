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
  updateDoc,
} from 'firebase/firestore';
import { getPlanLimit } from '../utils/plans';
import { recalculateGamification } from '../services/gamification';
import { executeConfirmBooking } from '../services/BookingService';
import { AppUser } from '../types';

export interface BookedSession {
  id: string;
  date: string;
  time: string;
  clientName?: string;
  userId?: string;
  isRecurring?: boolean;
  sessionType?: SessionType;
  status?: 'pending' | 'confirmed' | 'rejected';
  rejectionReason?: string;
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
      const today = new Date().toISOString().split('T')[0];
      const taken: TakenSlots = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        // Only mark future slots as "taken" — past ones are cleaned from the grid display
        if (data.date >= today) {
          taken[`${data.date}_${data.time}`] = true;
        }
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

          allSessions.push({
            id: docSnap.id,
            clientName,
            userId: uid,
            status: 'confirmed', // Default for old data
            ...data
          } as BookedSession);
        }
        setBookedSessions(allSessions);
      });
      return () => unsubscribe();
    } else {
      const q = query(collection(db!, `agenda/${user.id}/events`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setBookedSessions(
          snapshot.docs.map((d) => ({
            id: d.id,
            status: 'confirmed', // Default for old data
            ...d.data()
          } as BookedSession))
        );
      });
      return () => unsubscribe();
    }
  }, [user?.id, isTrainer]);

  const updateSessionStatus = async (sessionId: string, status: 'confirmed' | 'rejected', targetUserId?: string, reason?: string) => {
    const uid = targetUserId || user?.id;
    if (!uid) return { ok: false, error: 'No user ID' };

    try {
      const batch = writeBatch(db!);
      const eventRef = doc(db!, `agenda/${uid}/events`, sessionId);
      batch.update(eventRef, {
        status,
        rejectionReason: reason || null,
        updatedAt: Timestamp.now(),
      });

      if (status === 'rejected') {
        // Find and delete the bookedSlot to free the schedule
        const session = bookedSessions.find(s => s.id === sessionId);
        if (session) {
          const slotId = `${session.date}_${session.time.replace(':', '-')}`;
          batch.delete(doc(db!, 'bookedSlots', slotId));
        }
      }

      await batch.commit();
      return { ok: true };
    } catch (e) {
      console.error('updateSessionStatus failed:', e);
      return { ok: false, error: 'Error al actualizar estado' };
    }
  };

  // ── Derived helpers ──
  const getSessionsInWeek = (weekStart: Date): number => {
    if (isTrainer) return 0;
    const startStr = weekStart.toISOString().split('T')[0];
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const endStr = endOfWeek.toISOString().split('T')[0];
    return bookedSessions.filter((s) => s.date >= startStr && s.date <= endStr && s.status !== 'rejected').length;
  };

  const getWeeklyLimit = (): number => getPlanLimit(user?.plan);

  // ── Mutations ──

  const confirmBooking = async (params: ConfirmParams): Promise<BookingResult> => {
    if (!user?.id) return { ok: false, error: 'No user' };
    return executeConfirmBooking({
      userId: user.id,
      sessionDay: params.sessionDay,
      sessionTime: params.sessionTime,
      startOfWeek: params.startOfWeek,
      isRecurring: params.isRecurring,
      sessionType: params.sessionType,
      takenSlots,
    });
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
    updateSessionStatus,
  };
};
