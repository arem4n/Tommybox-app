import { auth } from '../services/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  User
} from 'firebase/auth';

export async function signIn() {
  if (!auth) throw new Error("Firebase Auth not initialized");
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Sign in error", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    const result = await firebaseSignInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Email sign in error", error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, pass: string) {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    const result = await firebaseCreateUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Email sign up error", error);
    throw error;
  }
}

export async function signOut() {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign out error", error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}
