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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      // Handled by App.tsx router
    }
  }, [isLoggedIn]);

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (isRegistering) {
        await signUpWithEmail(email, password);
        // Will trigger onAuthStateChanged in App.tsx
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <HomeView setCurrentView={setCurrentView} />
      <section id="login-section" className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden border border-gray-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4 shadow-inner">
              <ShieldCheck className="text-blue-600" size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Bienvenido</h2>
            <p className="text-gray-500 mt-2 font-medium">Únete a Tommybox hoy mismo.</p>
          </div>

          {errorMsg && (
             <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
               {errorMsg}
             </div>
          )}

          <form onSubmit={onEmailSubmit} className="space-y-4 mb-6">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all transform hover:scale-[1.02] shadow-md disabled:opacity-70 flex justify-center"
            >
              {isLoading ? 'Cargando...' : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </button>
          </form>

          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>

          <div className="relative flex items-center py-4 mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">O continúa con</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-bold"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </div>
      </section>

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
