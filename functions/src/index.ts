import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { recalculateGamificationServer } from './recalculateGamification';

// Initialize Firebase Admin SDK once
initializeApp();

/**
 * onAgendaEvent — Cloud Function (Gen 2, complement mode)
 *
 * Triggered on every CREATE, UPDATE, or DELETE of a document inside
 * `agenda/{userId}/events/{eventId}`.
 *
 * The client already calls recalculateGamification() immediately after booking,
 * so the user sees instant feedback. This function acts as the authoritative
 * server-side backup — ensuring gamification stays accurate even if:
 *   - The client call was interrupted (app close, network loss)
 *   - Data was modified directly in the Firestore console
 *
 * Deploy with:
 *   cd functions && npm install && npm run build
 *   firebase deploy --only functions
 */
export const onAgendaEvent = onDocumentWritten(
  'agenda/{userId}/events/{eventId}',
  async (event) => {
    const { userId } = event.params;

    // Skip if the document didn't actually change data (rare edge case)
    if (!event.data?.before?.exists && !event.data?.after?.exists) return;

    const db = getFirestore();

    try {
      await recalculateGamificationServer(db, userId);
      console.log(`[onAgendaEvent] Gamification recalculated for user ${userId}`);
    } catch (error) {
      console.error(`[onAgendaEvent] Failed for user ${userId}:`, error);
      // Do NOT re-throw — Cloud Functions retry on unhandled errors,
      // which could cause an infinite loop if the gamification update
      // itself triggers this function.
    }
  }
);

export const onFeelingWritten = onDocumentWritten(
  'users/{userId}/feelings/{feelingId}',
  async (event) => {
    const { userId } = event.params;
    if (!event.data?.after?.exists) return;
    const db = getFirestore();
    try {
      await recalculateGamificationServer(db, userId);
      console.log(`[onFeelingWritten] Gamification recalculated for user ${userId}`);
    } catch (error) {
      console.error(`[onFeelingWritten] Failed for user ${userId}:`, error);
    }
  }
);
