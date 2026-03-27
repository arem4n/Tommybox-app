import HomeView from "./HomeView";
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { View, UserProfile } from '../../types';
import { signInWithEmail, signUpWithEmail } from '../../lib/auth';

interface LoginViewProps {
  setCurrentView: (view: View) => void;
  isLoggedIn: boolean;
  handleLogin: () => Promise<void>;
  completeRegistration: (user: UserProfile & { id: string }, data: { displayName: string, birthDate: string, plan: string }) => Promise<void> | void;
  pendingCompletionUser: (UserProfile & { id: string }) | null;
  setPendingCompletionUser: (user: (UserProfile & { id: string }) | null) => void;
}

interface RegistrationModalProps {
  userToComplete: UserProfile & { id: string };
  onClose: () => void;
  onComplete: (user: UserProfile & { id: string }, data: { displayName: string, birthDate: string, plan: string }) => Promise<void> | void;
}

const ONBOARDING_PLANS = [
  {
    id: "plan_1",
    name: "1 Sesión / Semana",
    price: 70000,
    badge: null,
    features: ["4 sesiones al mes", "Programa personalizado", "Seguimiento de progreso"],
  },
  {
    id: "plan_2",
    name: "2 Sesiones / Semana",
    price: 80000,
    badge: "Más Popular",
    features: ["8 sesiones al mes", "Programa personalizado", "Seguimiento de progreso", "Chat con entrenador"],
  },
  {
    id: "plan_3",
    name: "3 Sesiones / Semana",
    price: 90000,
    badge: null,
    features: ["12 sesiones al mes", "Programa personalizado", "Seguimiento de progreso", "Chat con entrenador", "Acceso prioritario"],
  },
];

const RegistrationModal: React.FC<RegistrationModalProps> = ({ userToComplete, onClose, onComplete }) => {
  const [userData, setUserData] = useState({ displayName: '', birthDate: '' });
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<string>('plan_2');

  const handleNextStep = () => {
    if (!userData.displayName || !userData.birthDate) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    setStep(2);
  };

  const handleComplete = async (planId: string) => {
    await onComplete(userToComplete, { ...userData, plan: planId });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
        {step === 1 ? (
            <>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Casi listo! 🎯</h3>
                <p className="text-gray-600 mb-6">Completa tu perfil para comenzar.</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo quieres que te llamemos? *</label>
                  <input type="text" value={userData.displayName} onChange={(e) => setUserData({ ...userData, displayName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" placeholder="Ej: Juan P." required />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                  <input type="date" value={userData.birthDate} onChange={(e) => setUserData({ ...userData, birthDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div className="flex gap-4">
                  <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button onClick={handleNextStep} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Continuar →</button>
                </div>
            </>
        ) : (
            <>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Elige tu plan</h3>
                <p className="text-sm text-gray-500 mb-6">Puedes cambiarlo cuando quieras.</p>

                <div className="flex flex-col gap-3 mb-6">
                    {ONBOARDING_PLANS.map(plan => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                                    isSelected
                                        ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.02]'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 right-4">
                                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-900">{plan.name}</h4>
                                    <span className="font-black text-gray-900">
                                        {plan.price === 0 ? "Gratis" : `$ ${plan.price.toLocaleString('es-CL')} / mes`}
                                    </span>
                                </div>

                                <ul className="space-y-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                                            <span className="text-blue-500 font-bold">✓</span> {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => handleComplete(selectedPlan)}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors"
                >
                    Comenzar
                </button>
                <div className="mt-4 text-center">
                    <button
                        onClick={() => handleComplete('starter')}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
                    >
                        Continuar con plan gratuito
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

const LoginView: React.FC<LoginViewProps> = ({ setCurrentView, isLoggedIn, handleLogin, completeRegistration, pendingCompletionUser, setPendingCompletionUser }) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onEmailAuth = async (email: string, password: string, isRegistering: boolean) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (isRegistering) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setErrorMsg('El correo ya está en uso.');
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') setErrorMsg('Correo o contraseña incorrectos.');
      else if (err.code === 'auth/weak-password') setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      else setErrorMsg(err.message || 'Error de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <HomeView
        setCurrentView={setCurrentView}
        handleLogin={handleLogin}
        onEmailAuth={onEmailAuth}
        authError={errorMsg}
      />
      {pendingCompletionUser && (
        <RegistrationModal
          userToComplete={pendingCompletionUser}
          onClose={() => setPendingCompletionUser(null)}
          onComplete={completeRegistration}
        />
      )}
    </>
  );
};

export default LoginView;
