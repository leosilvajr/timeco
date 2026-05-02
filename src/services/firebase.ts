import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const DB_MODE = process.env.EXPO_PUBLIC_DB_MODE || 'emulator';

export const isEmulatorMode = DB_MODE === 'emulator';
export const isProductionMode = DB_MODE === 'production';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'dev-api-key-timeco',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'timeco-dev',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'timeco-dev.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:dev',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

let emulatorsConnected = false;

if (isEmulatorMode && !emulatorsConnected) {
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';
  const authPort = parseInt(process.env.EXPO_PUBLIC_EMULATOR_AUTH_PORT || '9096', 10);
  const firestorePort = parseInt(process.env.EXPO_PUBLIC_EMULATOR_FIRESTORE_PORT || '8083', 10);
  const storagePort = parseInt(process.env.EXPO_PUBLIC_EMULATOR_STORAGE_PORT || '9196', 10);

  try {
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, firestorePort);
    connectStorageEmulator(storage, host, storagePort);
    emulatorsConnected = true;

    console.log('=== MODO DOCKER (Firebase Emulators) ===');
    console.log(`  Firestore: http://${host}:${firestorePort}`);
    console.log(`  Auth:      http://${host}:${authPort}`);
    console.log(`  Storage:   http://${host}:${storagePort}`);
    console.log(`  UI:        http://${host}:4003`);
    console.log('========================================');
  } catch (err) {
    console.warn('Emulator connection error', err);
  }
}

if (isProductionMode) {
  console.log('=== MODO PRODUÇÃO (Firebase real) ===');
  console.log(`  Projeto: ${firebaseConfig.projectId}`);
}

export { app, auth, db, storage };
