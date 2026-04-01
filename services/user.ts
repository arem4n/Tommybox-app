import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { UserProfile, GamificationProfile } from '../types';
import { createUserProfile } from './db';

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

export const initializeNewUser = async (firebaseUser: User): Promise<UserProfile & { id: string }> => {
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
    return newUser;
};
