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
  limit as fbLimit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppNotification, NotificationType } from '../types';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
): Promise<void> => {
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
      fbLimit(50),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
};

/**
 * Inscreve callback nas notificações do usuário (mais recentes primeiro).
 * Retorna função de unsubscribe.
 */
export const subscribeNotifications = (
  userId: string,
  cb: (n: AppNotification[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    fbLimit(50),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
  });
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', id), { read: true });
};

/** Marca como lidas todas as notificações pendentes do usuário (em paralelo). */
export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
    ),
  );
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
};

/**
 * Best-effort: nunca propaga erro do createNotification para o caller.
 * Notificação é metadata — falhar nela não pode invalidar a ação principal
 * (ex.: enviar mensagem, criar evento).
 */
export const notifySafe = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
): Promise<void> => {
  try {
    await createNotification(userId, type, title, body, link);
  } catch (err) {
    console.warn(`createNotification(${type}) falhou:`, err);
  }
};
