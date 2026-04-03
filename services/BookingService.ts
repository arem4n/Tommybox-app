/**
 * BookingService — mutation layer for agenda bookings.
 *
 * Extracted from useAgenda.ts to give confirmBooking a single responsibility:
 * write to Firestore. The hook stays as the subscription/state layer.
 *
 * Responsibilities:
 *  1. Batch-write agenda event + bookedSlots doc
 *  2. Trigger client-side gamification recalculation
 *  3. Write firstSessionDate once (cohort analysis base)
 */

import { db } from './firebase';
import {
  collection,
  doc,
  Timestamp,
  writeBatch,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { recalculateGamification } from './gamification';
import { SessionType } from '../types';
import { TakenSlots, BookingResult } from '../hooks/useAgenda';

export interface ExecuteConfirmParams {
  userId: string;
  sessionDay: number;
  sessionTime: string;
  startOfWeek: Date;
  isRecurring?: boolean;
  sessionType?: SessionType;
  takenSlots: TakenSlots;
}

export const executeConfirmBooking = async (
  params: ExecuteConfirmParams
): Promise<BookingResult> => {
  const {
    userId,
    sessionDay,
    sessionTime,
    startOfWeek,
    isRecurring = false,
    takenSlots,
  } = params;

  const weeksToBook = isRecurring ? 4 : 1;
  let successfulBookings = 0;

  try {
    for (let i = 0; i < weeksToBook; i++) {
      const slotDate = new Date(startOfWeek);
      slotDate.setDate(slotDate.getDate() + sessionDay + i * 7);
      const dateStr = slotDate.toISOString().split('T')[0];
      const slotId = `${dateStr}_${sessionTime.replace(':', '-')}`;

      if (i > 0 && takenSlots[slotId]) continue;

      // ── 1-hour booking cutoff (server-side enforcement) ──────────────────────
      const [slotHour, slotMin] = sessionTime.split(':').map(Number);
      const slotDateTime = new Date(slotDate);
      slotDateTime.setHours(slotHour, slotMin, 0, 0);
      if (slotDateTime <= new Date(Date.now() + 60 * 60 * 1000)) {
        if (i === 0) return { ok: false, error: 'No se puede agendar con menos de 1 hora de anticipación.' };
        continue; // skip recurring slots that are too close
      }

      const batch = writeBatch(db!);

      const eventRef = doc(collection(db!, `agenda/${userId}/events`));
      batch.set(eventRef, {
        date: dateStr,
        time: sessionTime,
        createdAt: Timestamp.now(),
        isRecurring,
        sessionType: params.sessionType ?? 'Fuerza',
        status: 'pending',
      });

      const slotRef = doc(db!, 'bookedSlots', slotId);
      batch.set(slotRef, {
        date: dateStr,
        time: sessionTime,
        bookedBy: userId,
        createdAt: Timestamp.now(),
      });

      await batch.commit();
      successfulBookings++;
    }

    // Gamification — client-side complement (CF triggers server-side authoritatively)
    recalculateGamification(userId).catch(console.error);

    // firstSessionDate — written once, enables cohort analysis
    if (successfulBookings > 0) {
      try {
        const userSnap = await getDoc(doc(db!, 'users', userId));
        if (userSnap.exists() && !userSnap.data().firstSessionDate) {
          await updateDoc(doc(db!, 'users', userId), {
            firstSessionDate: Timestamp.now(),
          });
        }
      } catch (e) {
        // Non-blocking: booking already succeeded
        console.warn('firstSessionDate write failed:', e);
      }
    }

    return { ok: true, successfulBookings, totalWeeks: weeksToBook };
  } catch (e) {
    console.error('executeConfirmBooking failed:', e);
    return { ok: false, error: 'Error al agendar la sesión' };
  }
};
