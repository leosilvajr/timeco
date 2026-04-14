import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppNotification, NotificationType } from '../types';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) => {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    body,
    link: link ?? null,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const listNotifications = async (userId: string): Promise<AppNotification[]> => {
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
};

export const markNotificationRead = async (id: string) => {
  await updateDoc(doc(db, 'notifications', id), { read: true });
};
