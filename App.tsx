
import React, { useState, useEffect, Suspense } from 'react';
import { User } from 'firebase/auth';
import { View, UserProfile, GamificationProfile } from './types';
import { views } from './constants';
import { mockTrainer, updateUserPlan, cleanOldTrackers, checkAndApplyBirthdayBonus } from './services/mockData';
import { subscribeToAuth, signIn, signOut } from './lib/auth';
import { db } from './services/firebase';
import { doc, getDocFromServer, Timestamp } from 'firebase/firestore';
import { getUserProfile, createUserProfile, updateUserProfile } from './services/db';

import NavMenu from './components/NavMenu';
import HomeView from './components/views/HomeView';
import PlansView from './components/views/PlansView';
import LoginView from './components/views/LoginView';
import RewardNotification from './components/RewardNotification';
import { Loader2 } from 'lucide-react';

// Lazy Load heavy components for performance (Code Splitting)
// This ensures libraries like @google/genai are not loaded on the Landing Page
const AgendaView = React.lazy(() => import('./components/views/AgendaView'));
const AchievementsView = React.lazy(() => import('./components/views/AchievementsView'));
const TrainerDashboardView = React.lazy(() => import('./components/views/TrainerDashboardView'));
const RewardsStoreView = React.lazy(() => import('./components/views/RewardsStoreView'));
const DashboardView = React.lazy(() => import('./components/views/DashboardView'));
const ProfileView = React.lazy(() => import('./components/views/ProfileView'));
const ChatView = React.lazy(() => import('./components/ChatView'));

const createDefaultGamificationProfile = (userId: string): GamificationProfile => ({
    userId: userId,
    totalPoints: 0,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100, // Points for level 2
    badges: [],
    achievements: [
      { id: 'ach_attendance_10', title: 'Asistencia de Acero', description: 'Completa 10 sesiones', points: 50, progress: 0, total: 10, completed: false, type: 'attendance', text: '', userEmail: '', timestamp: Timestamp.now() as any },
      { id: 'ach_feedback_20', title: 'Feedback Fanático', description: 'Registra 20 sensaciones post-entrenamiento', points: 75, progress: 0, total: 20, completed: false, type: 'feedback', text: '', userEmail: '', timestamp: Timestamp.now() as any }
    ],
    streaks: [
        { type: 'training', current: 0, best: 0, lastUpdate: Timestamp.fromMillis(0) as any }
    ],
});

// Loading Spinner for Suspense
const LoadingSpinner = () => (
    <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
);

// Main App Component
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(views.HOME);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isTrainer, setIsTrainer] = useState<boolean>(false);
  const [user, setUser] = useState<(UserProfile & { id: string }) | null>(null);
  const [chatCompanionId, setChatCompanionId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [rewardQueue, setRewardQueue] = useState<any[]>([]);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [pendingCompletionUser, setPendingCompletionUser] = useState<(UserProfile & { id: string }) | null>(null);
  
  // Logout Modal State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Chat State shared between views
  const [selectedClientForChat, setSelectedClientForChat] = useState<string|null>(null);

  const trainerId = mockTrainer.id;

  useEffect(() => {
    cleanOldTrackers();
    
    async function testConnection() {
      if (!db) return;
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

    // Check session on load
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          if (!profile.registrationCompleted) {
            setPendingCompletionUser(profile);
            setCurrentView(views.LOGIN);
          } else {
            setUser(profile);
            setIsLoggedIn(true);
            setIsTrainer(profile.isTrainer);
            setCurrentView(views.DASHBOARD);
            const birthdayRewards = checkAndApplyBirthdayBonus(profile.id);
            if (birthdayRewards) {
                setRewardQueue(q => [...q, birthdayRewards]);
            }
          }
        } else {
          // Profile doesn't exist, create a basic one and ask to complete
          const newUser: UserProfile & { id: string } = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: firebaseUser.email?.split('@')[0] || 'user',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            isTrainer: firebaseUser.email === 'sergio.areman@gmail.com',
            createdAt: Timestamp.now() as any,
            gamification: createDefaultGamificationProfile(firebaseUser.uid),
            registrationCompleted: false,
          };
          await createUserProfile(firebaseUser.uid, newUser);
          setPendingCompletionUser(newUser);
          setCurrentView(views.LOGIN);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setIsTrainer(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (rewardQueue.length > 0 && !currentNotification) {
      const nextReward = rewardQueue[0];
      setCurrentNotification(nextReward);
      setRewardQueue(q => q.slice(1));
    }
  }, [rewardQueue, currentNotification]);

  const handleLogin = async () => {
    try {
        await signIn();
    } catch (error) {
        throw new Error("Error al iniciar sesión con Google.");
    }
  };

  const completeRegistration = async (userToComplete: UserProfile & { id: string }, additionalData: { displayName: string; birthDate: string }) => {
      const updatedData: Partial<UserProfile> = {
        displayName: additionalData.displayName,
        birthDate: additionalData.birthDate,
        registrationCompleted: true,
      };
      if (selectedPlan) {
        updatedData.plan = { name: selectedPlan, startDate: new Date().toISOString() };
      }
      
      await updateUserProfile(userToComplete.id, updatedData);
      
      const updatedUser = { ...userToComplete, ...updatedData };
      setUser(updatedUser as any);
      setIsLoggedIn(true);
      setIsTrainer(updatedUser.isTrainer);
      setCurrentView(views.DASHBOARD);
      setPendingCompletionUser(null);
      setSelectedPlan(null);
      alert(`¡Bienvenido a TommyBox, ${additionalData.displayName}! 🎉`);
  };
  
  // Trigger the logout confirmation modal
  const requestLogout = () => {
      setShowLogoutConfirm(true);
  };

  // Actual Logout Logic
  const executeLogout = async () => {
    setShowLogoutConfirm(false);
    
    await signOut();
    
    // Aggressive reset of all states
    setChatCompanionId(null);
    setShowChat(false);
    setPendingCompletionUser(null);
    setUser(null);
    setIsTrainer(false);
    setIsLoggedIn(false);
    setCurrentView(views.HOME);
    
    // Optional: clear any ephemeral states if necessary
    window.scrollTo(0, 0);
  };

  const handleOpenChat = () => {
      if (isTrainer && selectedClientForChat) {
          setChatCompanionId(selectedClientForChat);
          setShowChat(true);
      } else if (!isTrainer && trainerId) {
          setChatCompanionId(trainerId);
          setShowChat(true);
      }
  };

  const handlePlanSelect = async (planName: string) => {
    if (isLoggedIn && user) {
        const planData = { plan: { name: planName, startDate: new Date().toISOString() } };
        await updateUserProfile(user.id, planData);
        setUser({ ...user, plan: planData.plan } as any);
        alert(`¡Plan "${planName}" seleccionado!`);
        setCurrentView(views.DASHBOARD);
    } else {
        setSelectedPlan(planName);
        setCurrentView(views.LOGIN);
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfile(user.id, updatedData);
    setUser({ ...user, ...updatedData } as any);
    alert("Perfil actualizado con éxito.");
    setCurrentView(views.DASHBOARD);
  };

  const renderView = () => {
    switch (currentView) {
      case views.HOME:
        return <HomeView setCurrentView={setCurrentView} />;
      case views.PLANS:
        return <PlansView setCurrentView={setCurrentView} isLoggedIn={isLoggedIn} handlePlanSelect={handlePlanSelect} isTrainer={isTrainer} />;
      case views.AGENDA:
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <AgendaView userId={user?.id} userPlan={user?.plan} setRewardQueue={setRewardQueue} setCurrentView={setCurrentView} isTrainer={isTrainer} />
            </Suspense>
        );
      case views.ACHIEVEMENTS:
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <AchievementsView />
            </Suspense>
        );
      case views.LOGIN:
        return <LoginView setCurrentView={setCurrentView} isLoggedIn={isLoggedIn} handleLogin={handleLogin} completeRegistration={completeRegistration} pendingCompletionUser={pendingCompletionUser} setPendingCompletionUser={setPendingCompletionUser} />;
      case views.REWARDS_STORE:
        if (!isLoggedIn || !user) return <LoginView setCurrentView={setCurrentView} isLoggedIn={isLoggedIn} handleLogin={handleLogin} completeRegistration={completeRegistration} pendingCompletionUser={pendingCompletionUser} setPendingCompletionUser={setPendingCompletionUser} />;
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <RewardsStoreView user={user} setCurrentView={setCurrentView} />
            </Suspense>
        );
      case views.DASHBOARD:
        if (!isLoggedIn || !user) return <LoginView setCurrentView={setCurrentView} isLoggedIn={isLoggedIn} handleLogin={handleLogin} completeRegistration={completeRegistration} pendingCompletionUser={pendingCompletionUser} setPendingCompletionUser={setPendingCompletionUser} />;
        return (
             <Suspense fallback={<LoadingSpinner />}>
                {isTrainer ? (
                    <TrainerDashboardView 
                        setChatCompanionId={setChatCompanionId} 
                        setShowChat={setShowChat} 
                        setSelectedClientForChat={setSelectedClientForChat}
                        handleLogout={requestLogout}
                    />
                ) : (
                    <DashboardView 
                        trainerId={trainerId} 
                        user={user as any} 
                        setChatCompanionId={setChatCompanionId} 
                        setShowChat={setShowChat} 
                        setCurrentView={setCurrentView}
                        setRewardQueue={setRewardQueue}
                    />
                )}
             </Suspense>
        );
      case views.CHAT:
        return null; // Handled by overlay
      case views.PROFILE:
        if (!isLoggedIn || !user) return <LoginView setCurrentView={setCurrentView} isLoggedIn={isLoggedIn} handleLogin={handleLogin} completeRegistration={completeRegistration} pendingCompletionUser={pendingCompletionUser} setPendingCompletionUser={setPendingCompletionUser} />;
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <ProfileView user={user} onUpdateProfile={handleUpdateProfile} setCurrentView={setCurrentView} />
            </Suspense>
        );
      default:
        return <HomeView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 custom-scrollbar">
        {renderView()}
      </main>

      {/* NavMenu */}
      <div className="fixed bottom-0 left-0 w-full h-20 bg-white shadow-lg border-t border-gray-100 z-40 md:sticky md:top-0 md:h-20">
        <NavMenu 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            isLoggedIn={isLoggedIn} 
            handleLogout={requestLogout} 
        />
      </div>

      {/* Chat Overlay - Wrapped in Suspense because it loads GenAI SDK */}
      <Suspense fallback={null}>
        {showChat && user && chatCompanionId && (
            <ChatView 
                userId={user.id} 
                companionId={chatCompanionId} 
                onClose={() => setShowChat(false)} 
            />
        )}
      </Suspense>

      {/* Reward Notification */}
      {currentNotification && (
          <RewardNotification 
              reward={currentNotification} 
              onDismiss={() => setCurrentNotification(null)} 
          />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar Sesión?</h3>
                <p className="text-gray-500 mb-6">Tendrás que volver a ingresar tus credenciales para acceder.</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={executeLogout}
                        className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                    >
                        Salir
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
