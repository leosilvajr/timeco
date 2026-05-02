import { Platform } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole } from '../types';

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  birthDate?: string;
  heightCm?: number;
  phone?: string;
}

export const onAuthStateChanged = (cb: (user: FirebaseUser | null) => void) =>
  firebaseOnAuthStateChanged(auth, cb);

export const signUp = async (input: SignUpInput): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  await updateProfile(cred.user, { displayName: input.name });

  const user: User = {
    id: cred.user.uid,
    email: input.email,
    name: input.name,
    displayName: input.name,
    role: 'user',
    birthDate: input.birthDate,
    heightCm: input.heightCm,
    phone: input.phone,
    createdAt: serverTimestamp() as unknown as null,
  };

  await setDoc(doc(db, 'users', cred.user.uid), user);
  return user;
};

export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  if (Platform.OS !== 'web') {
    throw new Error(
      'Login com Google ainda não está disponível no app mobile. Use email e senha.',
    );
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDocument(cred.user);
  return cred.user;
};

export const logout = () => signOut(auth);

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
};

/**
 * Garante que existe doc users/{uid}. Se não existir, cria com defaults
 * extraídos do FirebaseUser (Google, email/senha, etc.).
 */
export const ensureUserDocument = async (firebaseUser: FirebaseUser): Promise<User> => {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as User;
  }

  const fallbackName =
    firebaseUser.displayName ||
    firebaseUser.email?.split('@')[0] ||
    'Usuário';

  const newUser: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: fallbackName,
    displayName: fallbackName,
    role: 'user',
    createdAt: serverTimestamp() as unknown as null,
  };
  if (firebaseUser.photoURL) newUser.photoURL = firebaseUser.photoURL;

  await setDoc(ref, newUser);
  return newUser;
};

export const updateUserProfile = async (uid: string, patch: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
};

export const setUserRole = async (uid: string, role: UserRole) => {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  });
};
