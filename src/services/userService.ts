import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit as fbLimit,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export const searchUsersByEmail = async (email: string): Promise<User[]> => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return [];
  const q = query(
    collection(db, 'users'),
    where('email', '>=', trimmed),
    where('email', '<=', trimmed + '\uf8ff'),
    fbLimit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
};

export const searchUsersByName = async (name: string): Promise<User[]> => {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const q = query(
    collection(db, 'users'),
    where('name', '>=', trimmed),
    where('name', '<=', trimmed + '\uf8ff'),
    fbLimit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
};

export const getUserById = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
};

export const getUsersByIds = async (uids: string[]): Promise<User[]> => {
  if (!uids.length) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
  const results: User[] = [];
  for (const chunk of chunks) {
    const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
  }
  return results;
};

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, 'users'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
};
