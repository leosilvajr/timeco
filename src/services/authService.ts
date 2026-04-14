import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

export const logout = () => signOut(auth);

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
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
