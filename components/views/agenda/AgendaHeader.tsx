import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface AgendaHeaderProps {
  isTrainer: boolean;
  startOfWeek: Date;
  canGoBack: boolean;
  onWeekChange: (direction: -1 | 1) => void;
  isEligibleForEvaluation: boolean;
}

/** Displays the title, week range navigator, and free-evaluation banner. */
const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  isTrainer,
  startOfWeek,
  canGoBack,
  onWeekChange,
  isEligibleForEvaluation,
}) => {
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 5);

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" /> Agenda Semanal
          </h2>
          <p className="text-gray-500 text-sm">
            {isTrainer ? 'Gestiona las sesiones de todos los atletas' : 'Reserva tus horas de entrenamiento'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl">
          <button
            onClick={() => canGoBack && onWeekChange(-1)}
            disabled={!canGoBack}
            className={`p-2 rounded-lg transition-all ${canGoBack ? 'hover:bg-white hover:shadow-md text-gray-600' : 'text-gray-300 cursor-not-allowed opacity-50'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold w-36 text-center">
            {startOfWeek.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            {' — '}
            {endOfWeek.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => onWeekChange(1)}
            className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isEligibleForEvaluation && (
        <div className="flex items-start gap-4 bg-blue-600 text-white rounded-2xl px-5 py-4 shadow-lg">
          <span className="text-2xl mt-0.5">🎯</span>
          <div>
            <p className="font-black text-base">Tu primera sesión es una evaluación gratuita</p>
            <p className="text-blue-100 text-sm mt-0.5">
              Elige cualquier horario disponible abajo para agendar tu evaluación inicial sin costo. Tommy te contactará para confirmar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaHeader;
