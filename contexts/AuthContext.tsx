import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribeToAuth, signIn, signOut } from '../lib/auth';
import { UserProfile, GamificationProfile } from '../types';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/db';
import { initializeNewUser } from '../services/user';

interface AuthContextType {
  isLoggedIn: boolean;
  user: (UserProfile & { id: string }) | null;
  loading: boolean;
  pendingCompletionUser: (UserProfile & { id: string }) | null;
  handleLogin: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  completeRegistration: (
    userToComplete: UserProfile & { id: string }, 
    additionalData: { displayName: string; birthDate: string; plan: string }
  ) => Promise<void>;
  setPendingCompletionUser: (user: (UserProfile & { id: string }) | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<(UserProfile & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCompletionUser, setPendingCompletionUser] = useState<(UserProfile & { id: string }) | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        let profile = await getUserProfile(firebaseUser.uid);
        
        if (profile) {
          if (!profile.registrationCompleted) {
            setPendingCompletionUser(profile);
            setUser(null);
            setIsLoggedIn(false);
          } else {
            setUser(profile);
            setIsLoggedIn(true);
            setPendingCompletionUser(null);
          }
        } else {
          // Profile doesn't exist, create a basic one and ask to complete
          const newUser = await initializeNewUser(firebaseUser);
          setPendingCompletionUser(newUser);
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setPendingCompletionUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Error al iniciar sesión", error);
    }
  };

  const handleSignOut = async () => {
      try {
          await signOut();
      } catch (error) {
          console.error("Error al cerrar sesión", error);
      }
  };

  const completeRegistration = async (
    userToComplete: UserProfile & { id: string }, 
    additionalData: { displayName: string; birthDate: string; plan: string }
  ) => {
    const updatedData: Partial<UserProfile> = {
      displayName: additionalData.displayName,
      birthDate: additionalData.birthDate,
      plan: additionalData.plan || "starter",
      registrationCompleted: true,
    };
    
    await updateUserProfile(userToComplete.id, updatedData);
    
    const updatedUser = { ...userToComplete, ...updatedData };
    setUser(updatedUser as UserProfile & { id: string });
    setIsLoggedIn(true);
    setPendingCompletionUser(null);
    // Welcome feedback is handled by the UI transition to the dashboard
  };

  return (
    <AuthContext.Provider value={{ 
        isLoggedIn, 
        user, 
        loading, 
        pendingCompletionUser, 
        handleLogin, 
        handleSignOut,
        completeRegistration,
        setPendingCompletionUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
