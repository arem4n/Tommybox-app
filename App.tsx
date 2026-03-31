import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProfile, GamificationProfile } from './types';
import { subscribeToAuth, signIn } from './lib/auth';
import { db } from './services/firebase';
import { doc, getDocFromServer, Timestamp } from 'firebase/firestore';
import { getUserProfile, createUserProfile, updateUserProfile } from './services/db';
import LoginView from './components/views/LoginView';
import DashboardLayout from './components/views/DashboardLayout';
import ProtectedRoute from './components/views/ProtectedRoute';
import ResetPasswordView from './components/views/ResetPasswordView';
import { Loader2 } from 'lucide-react';

const createDefaultGamificationProfile = (userId: string): GamificationProfile => ({
    userId, totalPoints: 0, level: 1, experience: 0, experienceToNextLevel: 100, badges: [],
    achievements: [
      { id: 'ach_attendance_10', title: 'Asistencia de Acero', description: 'Completa 10 sesiones', points: 50, progress: 0, total: 10, completed: false, type: 'attendance', text: '', userEmail: '', timestamp: Timestamp.now() as any },
      { id: 'ach_feedback_20', title: 'Feedback Fanático', description: 'Registra 20 sensaciones post-entrenamiento', points: 75, progress: 0, total: 20, completed: false, type: 'feedback', text: '', userEmail: '', timestamp: Timestamp.now() as any }
    ],
    streaks: [{ type: 'training', current: 0, best: 0, lastUpdate: Timestamp.fromMillis(0) as any }],
});

const LoadingSpinner = () => (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
);

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<(UserProfile & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCompletionUser, setPendingCompletionUser] = useState<(UserProfile & { id: string }) | null>(null);

  useEffect(() => {
    async function testConnection() {
      if (!db) return;
      try { await getDocFromServer(doc(db, 'test', 'connection')); }
      catch (error) { if(error instanceof Error && error.message.includes('the client is offline')) console.error("Check Firebase config."); }
    }
    testConnection();
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          if (!profile.registrationCompleted) { setPendingCompletionUser(profile); }
          else { setUser(profile); setIsLoggedIn(true); }
        } else {
          const newUser: UserProfile & { id: string } = {
            id: firebaseUser.uid, email: firebaseUser.email || '',
            username: firebaseUser.email?.split('@') || 'user',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@') || 'Usuario',
            isTrainer: firebaseUser.email === 'sergio.areman@gmail.com',
            createdAt: Timestamp.now() as any,
            gamification: createDefaultGamificationProfile(firebaseUser.uid),
            registrationCompleted: false,
          };
          await createUserProfile(firebaseUser.uid, newUser);
          setPendingCompletionUser(newUser);
        }
      } else { setUser(null); setIsLoggedIn(false); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => { try { await signIn(); } catch (error) { console.error("Error al iniciar sesión", error); } };

  const completeRegistration = async (userToComplete: UserProfile & { id: string }, additionalData: { displayName: string; birthDate: string; plan: string }) => {
      const updatedData: Partial<UserProfile> = { displayName: additionalData.displayName, birthDate: additionalData.birthDate, plan: additionalData.plan || "starter", registrationCompleted: true };
      await updateUserProfile(userToComplete.id, updatedData);
      setUser({ ...userToComplete, ...updatedData } as any);
      setIsLoggedIn(true);
      setPendingCompletionUser(null);
      alert(`¡Bienvenido a TommyBox, ${additionalData.displayName}! 🎉`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/" element={ isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginView setCurrentView={() => {}} isLoggedIn={isLoggedIn} handleLogin={handleLogin} completeRegistration={completeRegistration} pendingCompletionUser={pendingCompletionUser} setPendingCompletionUser={setPendingCompletionUser} /> } />
        <Route path="/dashboard/*" element={<ProtectedRoute user={user}><DashboardLayout user={user} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
