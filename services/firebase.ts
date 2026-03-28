import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let appId: string = firebaseConfig.appId || 'default-app-id';

try {
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
    storage = getStorage(app);
  } else {
    console.warn('Firebase config is empty. Firebase services will not be available.');
  }
} catch (e) {
  console.error('Error initializing Firebase:', e);
}

export { app, auth, db, storage, appId };
