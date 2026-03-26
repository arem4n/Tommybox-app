
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { View, UserProfile } from '../../types';
import { signInWithEmail, signUpWithEmail } from '../../lib/auth';

interface LoginViewProps {
  setCurrentView: (view: View) => void;
  isLoggedIn: boolean;
  handleLogin: () => Promise<void>;
  completeRegistration: (user: UserProfile & { id: string }, data: { displayName: string, birthDate: string }) => Promise<void> | void;
  pendingCompletionUser: (UserProfile & { id: string }) | null;
  setPendingCompletionUser: (user: (UserProfile & { id: string }) | null) => void;
}

interface RegistrationModalProps {
  userToComplete: UserProfile & { id: string };
  onClose: () => void;
  onComplete: (user: UserProfile & { id: string }, data: { displayName: string, birthDate: string }) => Promise<void> | void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ userToComplete, onClose, onComplete }) => {
  const [userData, setUserData] = useState({ displayName: '', birthDate: '' });

  const handleComplete = async () => {
    if (!userData.displayName || !userData.birthDate) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    await onComplete(userToComplete, userData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl relative">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Casi listo! 🎯</h3>
        <p className="text-gray-600 mb-6">Completa tu perfil para comenzar.</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">¿Cómo quieres que te llamemos? *</label>
          <input type="text" value={userData.displayName} onChange={(e) => setUserData({ ...userData, displayName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-md" placeholder="Ej: Juan P." required />
          <p className="mt-1 text-xs text-gray-500">Este nombre aparecerá en tu perfil y logros.</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
          <input type="date" value={userData.birthDate} onChange={(e) => setUserData({ ...userData, birthDate: e.target.value })} max={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-gray-300 rounded-md" required />
          <p className="mt-1 text-xs text-gray-500">🎂 ¡Recibirás una sorpresa en tu cumpleaños!</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleComplete} disabled={!userData.displayName || !userData.birthDate} className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300">Completar Registro</button>
        </div>
      </div>
    </div>
  );
};

const LoginView: React.FC<LoginViewProps> = ({ setCurrentView, isLoggedIn, handleLogin, completeRegistration, pendingCompletionUser, setPendingCompletionUser }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      setCurrentView('dashboard');
    }
  }, [isLoggedIn, setCurrentView]);

  const onGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await handleLogin();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("El correo ya está en uso.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(err.message || "Error de autenticación");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <section className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
            <img 
              src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png" 
              alt="TommyBox Logo" 
              className="h-16 object-contain" 
            />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
        </h2>
        
        {error && <p className="text-sm text-center text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100 mb-6">{error}</p>}
        
        <form onSubmit={onEmailAuth} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="tu@correo.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading} 
            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isLoading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continúa con</span>
          </div>
        </div>

        <button 
          onClick={onGoogleLogin} 
          type="button"
          disabled={isLoading} 
          className="w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-3 mb-6"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        
        <p className="text-center text-sm text-gray-600">
          {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }} 
            className="ml-1 text-blue-600 font-semibold hover:underline"
          >
            {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
          </button>
        </p>
      </div>

      {pendingCompletionUser && (
        <RegistrationModal 
          userToComplete={pendingCompletionUser}
          onClose={() => setPendingCompletionUser(null)}
          onComplete={completeRegistration}
        />
      )}
    </section>
  );
};

export default LoginView;
