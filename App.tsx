import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { db } from './services/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

import LoginView from './components/views/LoginView';
import DashboardLayout from './components/views/DashboardLayout';
import ProtectedRoute from './components/views/ProtectedRoute';
import ResetPasswordView from './components/views/ResetPasswordView';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
);

const App: React.FC = () => {
  const { 
    isLoggedIn, 
    user, 
    loading, 
    pendingCompletionUser, 
    handleLogin, 
    completeRegistration, 
    setPendingCompletionUser 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!loading) {
      if (pendingCompletionUser && location.pathname !== '/') {
        navigate('/');
      } else if (isLoggedIn && location.pathname === '/') {
        navigate('/dashboard');
      }
    }
  }, [loading, isLoggedIn, pendingCompletionUser, navigate, location.pathname]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route
            path="/"
            element={
                isLoggedIn ? <Navigate to="/dashboard" replace /> :
                <LoginView
                    setCurrentView={() => {}}
                    isLoggedIn={isLoggedIn}
                    handleLogin={handleLogin}
                    completeRegistration={completeRegistration}
                    pendingCompletionUser={pendingCompletionUser}
                    setPendingCompletionUser={setPendingCompletionUser}
                />
            }
        />
        <Route
            path="/dashboard/*"
            element={
                <ProtectedRoute user={user as any}>
                    <DashboardLayout user={user as any} />
                </ProtectedRoute>
            }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
