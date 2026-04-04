import React, { useState } from 'react';
import { useAgenda } from '../../../hooks/useAgenda';
import { useModal } from '../../../contexts/ModalContext';
import { getPlanLimit } from '../../../utils/plans';
import AgendaHeader from './AgendaHeader';
import AgendaGrid from './AgendaGrid';
import BookingModal, { ModalState, INITIAL_MODAL } from './BookingModal';
import AgendaNotices from './AgendaNotices';
import { AppUser } from '../../../types';

// ── Week helpers ──────────────────────────────────────────────────────────────
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d;
};

interface AgendaSectionProps {
  user: AppUser;
}

/**
 * AgendaSection — composition root.
 * Wires useAgenda hook → AgendaHeader + AgendaGrid + BookingModal.
 * Contains only UI state (currentDate, modal) and slot-click orchestration.
 */
const AgendaSection: React.FC<AgendaSectionProps> = ({ user }) => {
  const { showAlert } = useModal();
  const { 
    bookedSessions, takenSlots, getSessionsInWeek, confirmBooking, 
    cancelBooking, modifyBooking, updateSessionStatus 
  } = useAgenda(user);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);

  const isTrainer = user.isTrainer;
  const userPlan = user.plan;

  const startOfWeek = getStartOfWeek(currentDate);
  const currentActualStartOfWeek = getStartOfWeek(new Date());
  const canGoBack = startOfWeek > currentActualStartOfWeek;

  const changeWeek = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d);
  };

  // Derived booking eligibility (client only)
  const isEligibleForEvaluation =
    !isTrainer &&
    (!userPlan || userPlan === 'Sin Plan' || userPlan === 'free') &&
    bookedSessions.length === 0;
  const hasPlan = isTrainer || (!!userPlan && userPlan !== 'Sin Plan' && userPlan !== 'free');
  const canBook = hasPlan || isEligibleForEvaluation;

  // ── Slot click orchestration ──────────────────────────────────────────────
  const handleSlotClick = (dayIndex: number, time: string) => {
    const slotDate = new Date(startOfWeek);
    slotDate.setDate(slotDate.getDate() + dayIndex);
    const dateStr = slotDate.toISOString().split('T')[0];

    if (slotDate < new Date() && slotDate.getDate() !== new Date().getDate()) return;

    const existingSession = bookedSessions.find((s) => s.date === dateStr && s.time === time);

    if (isTrainer) {
      if (existingSession) {
        setModal({
          type: 'trainer-actions',
          sessionTime: time,
          sessionDay: dayIndex,
          existingSessionId: existingSession.id,
          clientName: existingSession.clientName,
          userId: existingSession.userId,
          status: existingSession.status,
          rejectionReason: existingSession.rejectionReason,
          newTime: time,
          sessionType: existingSession.sessionType,
        });
      }
      return;
    }

    if (existingSession) {
      if (existingSession.status === 'rejected') {
        showAlert('Esta sesión fue rechazada. El aviso detallado aparecerá arriba de tu agenda.');
        return;
      }
      setModal({ 
        type: 'cancel', 
        sessionTime: time, 
        sessionDay: dayIndex, 
        existingSessionId: existingSession.id,
        status: existingSession.status
      });
      return;
    }

    if (!canBook) {
      setModal({ type: 'no-plan', sessionTime: time, sessionDay: dayIndex, message: 'Necesitas un plan activo o una evaluación disponible para agendar.' });
      return;
    }

    if (!isTrainer && hasPlan) {
      const weeklyLimit = getPlanLimit(userPlan);
      const sessionsThisWeek = getSessionsInWeek(startOfWeek);
      if (sessionsThisWeek >= weeklyLimit) {
        setModal({
          type: 'no-plan',
          sessionTime: time,
          sessionDay: dayIndex,
          message: `Límite alcanzado. Tu plan (${weeklyLimit}x) no permite más sesiones esta semana. Cancela otra sesión para liberar el cupo.`,
        });
        return;
      }
    }

    setModal({ type: 'confirm', sessionTime: time, sessionDay: dayIndex, isRecurring: false, sessionType: 'Fuerza' });
  };

  // ── Booking handlers (call hook + update modal) ───────────────────────────
  const handleConfirmBooking = async () => {
    if (modal.sessionDay === null) return;
    const result = await confirmBooking({
      sessionDay: modal.sessionDay,
      sessionTime: modal.sessionTime,
      startOfWeek,
      isRecurring: modal.isRecurring,
      sessionType: modal.sessionType,
    });

    if (result.ok) {
      // ── GA4: booking completed ──────────────────────────────────────────────
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'booking_completed', { method: 'calendar' });
      }

      let msg = modal.isRecurring
        ? `Se han agendado ${result.successfulBookings} sesiones exitosamente del mes.`
        : 'Tu sesión ha sido agendada correctamente.';
      if (modal.isRecurring && result.successfulBookings! < result.totalWeeks!) {
        msg += ` (${result.totalWeeks! - result.successfulBookings!} semanas ya estaban ocupadas).`;
      }
      setModal({ ...modal, type: 'success', message: msg });
    } else {
      showAlert(result.error ?? 'Error al agendar');
      setModal(INITIAL_MODAL);
    }
  };

  const handleCancelBooking = async () => {
    if (modal.sessionDay === null || !modal.existingSessionId) return;
    const result = await cancelBooking({
      sessionDay: modal.sessionDay,
      sessionTime: modal.sessionTime,
      startOfWeek,
      existingSessionId: modal.existingSessionId,
      targetUserId: modal.userId,
    });

    if (result.ok) {
      setModal(INITIAL_MODAL);
    } else {
      showAlert(result.error ?? 'Error al cancelar');
    }
  };

  const handleModifyBooking = async () => {
    if (modal.sessionDay === null || !modal.existingSessionId || !modal.newTime) return;
    const result = await modifyBooking({
      sessionDay: modal.sessionDay,
      sessionTime: modal.sessionTime,
      newTime: modal.newTime,
      startOfWeek,
      existingSessionId: modal.existingSessionId,
      targetUserId: modal.userId,
    });

    if (result.ok) {
      setModal(INITIAL_MODAL);
    } else {
      showAlert(result.error ?? 'Error al modificar');
    }
  };

  const handleUpdateStatus = async (status: 'confirmed' | 'rejected', reason?: string) => {
    if (!modal.existingSessionId) return;
    const result = await updateSessionStatus(modal.existingSessionId, status, modal.userId, reason);
    if (result.ok) {
      setModal(INITIAL_MODAL);
    } else {
      showAlert(result.error ?? 'Error al actualizar estado');
    }
  };

  return (
    <section className="container mx-auto max-w-5xl">
      <AgendaHeader
        isTrainer={isTrainer}
        startOfWeek={startOfWeek}
        canGoBack={canGoBack}
        onWeekChange={changeWeek}
        isEligibleForEvaluation={isEligibleForEvaluation}
      />

      {!isTrainer && (
        <AgendaNotices sessions={bookedSessions} userId={user.id} />
      )}

      <AgendaGrid
        startOfWeek={startOfWeek}
        bookedSessions={bookedSessions}
        takenSlots={takenSlots}
        isTrainer={isTrainer}
        onSlotClick={handleSlotClick}
      />

      <BookingModal
        modal={modal}
        setModal={setModal}
        startOfWeek={startOfWeek}
        isTrainer={isTrainer}
        takenSlots={takenSlots}
        onConfirmBooking={handleConfirmBooking}
        onCancelBooking={handleCancelBooking}
        onModifyBooking={handleModifyBooking}
        onUpdateStatus={handleUpdateStatus}
      />
    </section>
  );
};

export default AgendaSection;
