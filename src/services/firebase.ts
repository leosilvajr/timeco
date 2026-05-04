import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  connectAuthEmulator,
  Auth,
  // @ts-expect-error — getReactNativePersistence existe em runtime mas não no .d.ts oficial
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Detecta plataforma sem importar 'react-native' (que quebra jest no node env).
 * - Web: tem `document` global.
 * - React Native: não tem `document` (mas tem global.HermesInternal ou navigator.product).
 * - Jest node: não tem `document` — cai pra "native" mas o try/catch protege.
 */
const isWeb = typeof document !== 'undefined' && typeof window !== 'undefined';

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

/**
 * No web, getAuth() persiste em localStorage por padrão.
 * No native (iOS/Android), precisamos inicializar Auth com o adapter
 * de AsyncStorage explicitamente — caso contrário a sessão fica em
 * memória e o user precisa logar de novo a cada abertura do app.
 */
const initAuth = (): Auth => {
  if (isWeb) return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth falha se já foi inicializado (HMR no dev) ou em
    // ambiente de teste (jest node). Cai pro getAuth.
    return getAuth(app);
  }
};

const auth: Auth = initAuth();

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
