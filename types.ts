
import React from 'react';
import { Timestamp } from 'firebase/firestore';

export type View = 'home' | 'plans' | 'login';

/** Authenticated user with Firestore document id attached. Use this everywhere instead of `user: any`. */
export type AppUser = UserProfile & { id: string };

/** Tipo de sesión de entrenamiento */
export type SessionType = 'Fuerza' | 'Hipertrofia' | 'Potencia' | 'Movilidad' | 'Evaluación' | 'Deload';

/** Colores consistentes por tipo — compartidos entre grid, modales y gráficos */
export const SESSION_TYPE_CONFIG: Record<SessionType, { label: string; color: string; bg: string; border: string; text: string }> = {
  Fuerza:      { label: 'Fuerza',      color: '#3b82f6', bg: 'bg-blue-100',   border: 'border-blue-300',   text: 'text-blue-700' },
  Hipertrofia: { label: 'Hipertrofia', color: '#8b5cf6', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
  Potencia:    { label: 'Potencia',    color: '#f97316', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
  Movilidad:   { label: 'Movilidad',  color: '#10b981', bg: 'bg-green-100',  border: 'border-green-300',  text: 'text-green-700' },
  Evaluación:  { label: 'Evaluación', color: '#eab308', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
  Deload:      { label: 'Deload',     color: '#6b7280', bg: 'bg-gray-100',   border: 'border-gray-300',   text: 'text-gray-600' },
};


export interface Plan {
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
}

export interface Session {
  id: string;
  date: string;
  time: string;
  timestamp: Timestamp;
  sessionType?: SessionType;
}

export interface Metric {
    id: string;
    exercise: string;
    load: number;
    reps: number;
    rpe?: number; // Rate of Perceived Exertion (1-10)
    date: string;
    timestamp: Timestamp;
}

export interface Restriction {
  id: string;
  description: string;
  affectedZone: string;
  severity: 'leve' | 'moderada' | 'severa';
  active: boolean;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface Observation {
    id: string;
    comment: string;
    date: string;
    timestamp: Timestamp;
}

// This type is for both public and user-specific achievements.
export interface Achievement {
    id: string;
    text: string; // For public display
    userEmail: string;
    timestamp: Timestamp;
    // Fields for user-specific, progress-based achievements
    title?: string;
    description?: string;
    points?: number;
    progress?: number;
    total?: number;
    completed?: boolean;
    completedAt?: Timestamp;
    type?: AchievementType;
}

export type AchievementType = 
  | 'attendance' // Asistencia
  | 'consistency' // Rachas
  | 'progress' // Mejoras de peso/reps
  | 'social' // Interacción
  | 'feedback' // Registrar sensaciones
  | 'milestone' // Hitos específicos
  | 'challenge'; // Desafíos temporales


export interface Feeling {
    id: string;
    feeling: string;
    date: string;
    timestamp: Timestamp;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Timestamp;
  category: 'consistency' | 'strength' | 'social' | 'milestone' | 'special';
}

export interface Streak {
  type: 'training';
  current: number;
  best: number;
  lastUpdate: Timestamp;
}

export interface GamificationProfile {
  userId: string;
  totalPoints: number;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  badges: Badge[];
  achievements: Achievement[];
  streaks: Streak[];
}

export interface UserProfile {
    email: string;
    username: string;
    displayName?: string;
    birthDate?: string;
    registrationCompleted?: boolean;
    plan?: string;
    isTrainer: boolean;
    createdAt: Timestamp;
    gamification: GamificationProfile;
    photoURL?: string;
    lastBirthdayBonusYear?: number;
    paymentStatus?: string;
    status?: string;
    archivedAt?: Timestamp;
    assignedTrainerId?: string;
    weight?: number;
    height?: number;
    build?: string;
    /** Fecha de la primera sesión confirmada — base para cohort analysis */
    firstSessionDate?: Timestamp;
}

export interface DailyActionTracker {
  userId: string;
  date: string; // YYYY-MM-DD
  actions: {
    POST_WORKOUT_SENSATION?: number;
    CHECK_IN?: number;
  };
}

export interface PointsAwarded {
    points: number;
    newBadges: Badge[];
    leveledUp: boolean;
    newLevel: number;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  price: number; // New field for monetary cost
  category: 'merch' | 'subscription' | 'exclusive';
  imageUrl: string;
  stock: number | 'unlimited';
  icon: string;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  pointsSpent: number; // 0 if purchased with cash
  pricePaid?: number; // New: track if money was spent
  redeemedAt: Timestamp;
  status: 'pending' | 'shipped' | 'delivered' | 'activated';
  type: 'redemption' | 'purchase'; // New: distinguish transaction type
}

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const isBirthdayToday = (birthDate: string): boolean => {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  
  return (
    today.getMonth() === birth.getMonth() &&
    today.getDate() === birth.getDate()
  );
};
