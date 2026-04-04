import React from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Calendar, Check, Users, Edit2, Clock } from 'lucide-react';
import { BookedSession, TakenSlots } from '../../../hooks/useAgenda';
import { SessionType, SESSION_TYPE_CONFIG } from '../../../types';
import { DAYS, TIMES, INITIAL_MODAL } from './constants';
import { getGoogleCalendarUrl, getIcsDataUri } from './CalendarExport';

export interface ModalState {
  type: 'none' | 'no-plan' | 'cancel' | 'trainer-actions' | 'confirm' | 'success';
  sessionTime: string;
  sessionDay: number | null;
  message?: string;
  clientName?: string;
  isRecurring?: boolean;
  userId?: string;
  existingSessionId?: string;
  status?: 'pending' | 'confirmed' | 'rejected';
  rejectionReason?: string;
  newTime?: string;
  sessionType?: SessionType;
}

// INITIAL_MODAL has moved to ./constants.ts to keep this file HMR-compatible.
// Re-export it from there so existing imports of BookingModal keep working.
export { INITIAL_MODAL };

const SESSION_TYPES = Object.keys(SESSION_TYPE_CONFIG) as SessionType[];

interface BookingModalProps {
  modal: ModalState;
  setModal: (m: ModalState) => void;
  startOfWeek: Date;
  isTrainer: boolean;
  takenSlots: TakenSlots;
  onConfirmBooking: () => void;
  onCancelBooking: () => void;
  onModifyBooking: () => void;
  onUpdateStatus?: (status: 'confirmed' | 'rejected', reason?: string) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  modal, setModal, startOfWeek, isTrainer, takenSlots,
  onConfirmBooking, onCancelBooking, onModifyBooking, onUpdateStatus,
}) => {
  if (modal.type === 'none') return null;

  const close = () => setModal(INITIAL_MODAL);

  const sessionDate = (() => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + (modal.sessionDay ?? 0));
    return d;
  })();
  const dateStr = sessionDate.toISOString().split('T')[0];

  const currentType = modal.sessionType ?? 'Fuerza';
  const typeStyle = SESSION_TYPE_CONFIG[currentType];

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        {/* ── No Plan ── */}
        {modal.type === 'no-plan' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h3>
            <p className="text-gray-500 mb-6">{modal.message}</p>
            <button onClick={close} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Cerrar</button>
          </div>
        )}

        {/* ── Confirm ── */}
        {modal.type === 'confirm' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Reserva</h3>
            <p className="text-gray-500 mb-4">
              {DAYS[modal.sessionDay!]} a las{' '}
              <span className="font-bold text-gray-900">{modal.sessionTime}</span>
            </p>

            {/* Session type selector */}
            <div className="text-left mb-4">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                Tipo de sesión
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SESSION_TYPES.map((t) => {
                  const cfg = SESSION_TYPE_CONFIG[t];
                  const active = currentType === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setModal({ ...modal, sessionType: t })}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border-2 transition-all ${
                        active
                          ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-left mb-6">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={modal.isRecurring || false}
                  onChange={(e) => setModal({ ...modal, isRecurring: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Repetir este horario por el resto del mes (4 semanas)</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={close} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
              <button onClick={onConfirmBooking} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Confirmar</button>
            </div>
          </div>
        )}

        {/* ── Trainer Actions ── */}
        {modal.type === 'trainer-actions' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Sesión de {modal.clientName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-gray-500">{DAYS[modal.sessionDay!]} · {modal.sessionTime}</span>
                  {modal.sessionType && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${SESSION_TYPE_CONFIG[modal.sessionType].bg} ${SESSION_TYPE_CONFIG[modal.sessionType].text}`}>
                      {modal.sessionType}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {modal.status === 'pending' && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <Clock size={16} /> Sesión pendiente de validar
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onUpdateStatus?.('confirmed')}
                    className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs"
                  >
                    <Check size={14} /> Confirmar
                  </button>
                  <button 
                    onClick={() => setModal({ ...modal, type: 'cancel' })}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-xs border border-red-200"
                  >
                    <X size={14} /> Rechazar
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
              <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Edit2 size={12} /> Modificar horario
              </p>
              <select
                value={modal.newTime || modal.sessionTime}
                onChange={(e) => setModal({ ...modal, newTime: e.target.value })}
                className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
              >
                {TIMES.map((t) => {
                  const isTaken = takenSlots[`${dateStr}_${t}`] && t !== modal.sessionTime;
                  return <option key={t} value={t} disabled={isTaken}>{t}{isTaken ? ' (ocupado)' : ''}</option>;
                })}
              </select>
              <button
                onClick={onModifyBooking}
                disabled={!modal.newTime || modal.newTime === modal.sessionTime}
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Edit2 size={15} /> Guardar nuevo horario
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={close} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 text-sm">Cerrar</button>
              <button
                onClick={() => setModal({ ...modal, type: 'cancel' })}
                className="flex-1 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 text-sm border border-red-200 transition-colors"
              >
                Cancelar sesión
              </button>
            </div>
          </div>
        )}

        {/* ── Cancel ── */}
        {modal.type === 'cancel' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <X size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {modal.status === 'pending' && isTrainer ? 'Rechazar Sesión' : 'Cancelar Reserva'}
            </h3>
            <p className="text-gray-500 mb-4">
              {modal.status === 'pending' && isTrainer
                ? `¿Por qué quieres rechazar la sesión de ${modal.clientName}?`
                : `¿Estás seguro de cancelar la sesión${modal.clientName ? ` de ${modal.clientName}` : ''} para el`
              }
              {(!isTrainer || modal.status !== 'pending') && (
                <span className="font-bold text-gray-900 block mt-1">{DAYS[modal.sessionDay!]} a las {modal.sessionTime}</span>
              )}
            </p>

            {modal.status === 'pending' && isTrainer && (
              <textarea
                placeholder="Escribe el motivo (ej: Horario no disponible, fuera de servicio...)"
                value={modal.rejectionReason || ''}
                onChange={(e) => setModal({ ...modal, rejectionReason: e.target.value })}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:outline-none h-24"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => isTrainer ? setModal({ ...modal, type: 'trainer-actions' }) : close()}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
              >
                Volver
              </button>
              <button 
                onClick={() => (modal.status === 'pending' && isTrainer) ? onUpdateStatus?.('rejected', modal.rejectionReason) : onCancelBooking()} 
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
              >
                {modal.status === 'pending' && isTrainer ? 'Rechazar' : 'Cancelar Sesión'}
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {modal.type === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 animate-scale-up">
              <Check size={32} strokeWidth={4} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Reserva Exitosa!</h3>
            {modal.sessionType && (
              <span className={`inline-block text-xs font-black px-3 py-1 rounded-full mb-3 ${typeStyle.bg} ${typeStyle.text}`}>
                {modal.sessionType}
              </span>
            )}
            <p className="text-gray-500 mb-6">{modal.message || 'Tu sesión ha sido agendada correctamente.'}</p>
            <div className="space-y-3">
              <a
                href={getGoogleCalendarUrl(sessionDate, modal.sessionTime, modal.isRecurring)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Calendar size={18} /> Agregar a Google Calendar
              </a>
              <a
                href={getIcsDataUri(sessionDate, modal.sessionTime, modal.isRecurring)}
                download="entrenamiento_tommybox.ics"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Calendar size={18} /> Agregar a Apple Calendar (iOS)
              </a>
              <button onClick={close} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black mt-4">Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default BookingModal;
