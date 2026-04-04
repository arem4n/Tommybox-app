import { ModalState } from './BookingModal';

/** Day labels for the weekly grid */
export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Available time slots */
export const TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

/** Default (closed) modal state */
export const INITIAL_MODAL: ModalState = { type: 'none', sessionTime: '', sessionDay: null };
