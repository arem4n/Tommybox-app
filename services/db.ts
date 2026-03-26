import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, onSnapshot, Timestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { UserProfile, Metric, Observation, Feeling, Session, Achievement } from '../types';

// --- USERS ---

export async function getUserProfile(userId: string): Promise<(UserProfile & { id: string }) | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile & { id: string };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

export async function createUserProfile(userId: string, data: Partial<UserProfile>) {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}`);
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  if (!db) return;
  try {
    const docRef = doc(db, 'users', userId);
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await updateDoc(docRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export function subscribeToUsers(callback: (users: (UserProfile & { id: string })[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }));
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'users');
  });
}

// --- METRICS ---

export function subscribeToUserMetrics(userId: string, callback: (metrics: Metric[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, `users/${userId}/metrics`), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const metrics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Metric));
    callback(metrics);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/metrics`);
  });
}

export async function addMetric(userId: string, data: Omit<Metric, 'id' | 'timestamp'>) {
  if (!db) return;
  try {
    await addDoc(collection(db, `users/${userId}/metrics`), {
      ...data,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/metrics`);
  }
}

// --- OBSERVATIONS ---

export function subscribeToUserObservations(userId: string, callback: (observations: Observation[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, `users/${userId}/observations`), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const observations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Observation));
    callback(observations);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/observations`);
  });
}

export async function addObservation(userId: string, data: Omit<Observation, 'id' | 'timestamp'>) {
  if (!db) return;
  try {
    await addDoc(collection(db, `users/${userId}/observations`), {
      ...data,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/observations`);
  }
}

// --- FEELINGS ---

export function subscribeToUserFeelings(userId: string, callback: (feelings: Feeling[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, `users/${userId}/feelings`), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const feelings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feeling));
    callback(feelings);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/feelings`);
  });
}

export async function addFeeling(userId: string, data: Omit<Feeling, 'id' | 'timestamp'>) {
  if (!db) return;
  try {
    await addDoc(collection(db, `users/${userId}/feelings`), {
      ...data,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/feelings`);
  }
}

// --- SESSIONS ---

export function subscribeToUserSessions(userId: string, callback: (sessions: Session[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, `users/${userId}/sessions`), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
    callback(sessions);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/sessions`);
  });
}

export async function addSession(userId: string, data: Omit<Session, 'id' | 'timestamp'>) {
  if (!db) return;
  try {
    await addDoc(collection(db, `users/${userId}/sessions`), {
      ...data,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/sessions`);
  }
}
