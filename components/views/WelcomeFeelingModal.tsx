import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppUser } from '../../types';
import { useGamification } from '../../hooks/useGamification';
import { useAgenda } from '../../hooks/useAgenda';
import { X } from 'lucide-react';

interface WelcomeFeelingModalProps {
  user: AppUser;
}

const WelcomeFeelingModal: React.FC<WelcomeFeelingModalProps> = ({ user }) => {
  const { canRegisterFeeling, registerFeeling } = useGamification(user);
  const { bookedSessions } = useAgenda(user);
  const [isOpen, setIsOpen] = useState(false);
  
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [comment, setComment] = useState('');
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user?.isTrainer) return;

    if (canRegisterFeeling && bookedSessions.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
      
      const finishedSession = bookedSessions.find(s => {
        if (s.date === todayStr && s.status !== 'rejected') {
          return s.time <= currentTime;
        }
        if (s.date < todayStr && s.status !== 'rejected') {
           return true;
        }
        return false;
      });

      if (finishedSession) {
        // Slight delay to not block initial render abruptly
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [canRegisterFeeling, bookedSessions, user?.isTrainer]);

  if (!isOpen) return null;

  const handleRegisterFeeling = async () => {
    if (!selectedFeeling) return;
    const result = await registerFeeling({ feeling: selectedFeeling, comment, recoveryNotes });
    if (result.ok) {
      setSuccessMessage(`+${result.xpGained || 5} XP!`);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    }
  };

  const FEELINGS_OPTIONS = [
    { value: 'Excelente', label: '🚀 Excelente' },
    { value: 'Bien', label: '👍 Bien' },
    { value: 'Normal', label: '👌 Normal' },
    { value: 'Cansado', label: '🥱 Cansado' },
    { value: 'Muy duro', label: '🥵 Muy duro' },
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-black text-gray-900 mb-2">¡Buen trabajo! 💪</h2>
        <p className="text-sm text-gray-500 mb-6">¿Cómo te sentiste en tu último entrenamiento? Gana <span className="font-bold text-blue-600">+5 XP</span> por registrarlo.</p>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FEELINGS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedFeeling(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  selectedFeeling === opt.value
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-blue-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            placeholder="¿Algún comentario sobre el entrenamiento? (opcional)"
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 text-sm"
          />

          <textarea
            value={recoveryNotes}
            onChange={(e) => setRecoveryNotes(e.target.value)}
            maxLength={150}
            placeholder="Notas de recuperación: horas de sueño, dolores... (opcional)"
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16 text-sm"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
             <span className="text-xs text-gray-400">{comment.length}/200</span>
             <div className="flex items-center gap-4 w-full sm:w-auto">
               {successMessage && <span className="text-green-600 font-black animate-pulse">{successMessage}</span>}
               <button
                 onClick={handleRegisterFeeling}
                 disabled={!selectedFeeling}
                 className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 Guardar
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WelcomeFeelingModal;
