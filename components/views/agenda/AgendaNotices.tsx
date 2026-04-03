import React from 'react';
import { AlertCircle, X, Calendar } from 'lucide-react';
import { BookedSession } from '../../../hooks/useAgenda';
import { db } from '../../../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface AgendaNoticesProps {
  sessions: BookedSession[];
  userId: string;
}

const AgendaNotices: React.FC<AgendaNoticesProps> = ({ sessions, userId }) => {
  const rejected = sessions.filter(s => s.status === 'rejected');

  if (rejected.length === 0) return null;

  const dismiss = async (sessionId: string) => {
    try {
      await deleteDoc(doc(db!, `agenda/${userId}/events`, sessionId));
    } catch (e) {
      console.error('Failed to dismiss notice:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="mb-6 space-y-3 animate-fade-in">
      {rejected.map((s) => (
        <div key={s.id} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h4 className="text-sm font-black text-red-900 uppercase tracking-wider mb-1">
              Sesión Rechazada
            </h4>
            <p className="text-sm text-red-800 mb-2">
              Tu sesión del <span className="font-bold whitespace-nowrap">{formatDate(s.date)}</span> a las <span className="font-bold">{s.time}</span> fue rechazada.
            </p>
            {s.rejectionReason && (
              <div className="bg-white/60 rounded-xl p-3 border border-red-200/50 mb-3">
                <p className="text-xs font-bold text-red-600 uppercase tracking-tighter mb-1">Motivo del entrenador:</p>
                <p className="text-sm text-red-900 italic">"{s.rejectionReason}"</p>
              </div>
            )}
            <p className="text-xs text-red-500 font-medium">
              Por favor, elige otro horario o contacta a tu entrenador.
            </p>
          </div>
          <button 
            onClick={() => dismiss(s.id)}
            className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors bg-white/50 hover:bg-white p-1 rounded-lg"
            title="Descartar aviso"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AgendaNotices;
