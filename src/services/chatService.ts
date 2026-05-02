import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Chat, ChatMessage } from '../types';
import { notifySafe } from './notificationService';
import { getUserById } from './userService';

/** doc id determinístico: uids ordenados alfabeticamente. */
export const chatId = (a: string, b: string): string => (a < b ? `${a}_${b}` : `${b}_${a}`);

/** Cria o doc de chat se não existir. Idempotente. */
export const ensureChat = async (a: string, b: string): Promise<string> => {
  const id = chatId(a, b);
  const ref = doc(db, 'chats', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return id;
  await setDoc(ref, {
    members: [a, b].sort(),
    createdAt: serverTimestamp(),
  });
  return id;
};

/** Envia mensagem e atualiza metadados do chat (lastMessage, lastMessageAt). */
export const sendMessage = async (
  fromUserId: string,
  toUserId: string,
  text: string,
): Promise<void> => {
  const trimmed = text.trim();
  if (!trimmed) return;
  const id = await ensureChat(fromUserId, toUserId);

  await addDoc(collection(db, 'chats', id, 'messages'), {
    text: trimmed,
    senderId: fromUserId,
    createdAt: serverTimestamp(),
  });

  // Atualiza preview no doc do chat (best-effort).
  await setDoc(
    doc(db, 'chats', id),
    {
      members: [fromUserId, toUserId].sort(),
      lastMessage: trimmed,
      lastSenderId: fromUserId,
      lastMessageAt: serverTimestamp(),
    },
    { merge: true },
  );

  // Notifica o destinatário (best-effort, fora do caminho crítico).
  // Busca nome do remetente para personalizar o título.
  try {
    const sender = await getUserById(fromUserId);
    const senderName = sender?.name ?? 'Alguém';
    const preview = trimmed.length > 80 ? trimmed.slice(0, 77) + '...' : trimmed;
    await notifySafe(
      toUserId,
      'chat_message',
      `Mensagem de ${senderName}`,
      preview,
      `Chat:${fromUserId}`,
    );
  } catch (err) {
    console.warn('chat notify failed', err);
  }
};

/**
 * Inscreve-se em mensagens do chat em tempo real, ordenadas por createdAt asc.
 * Retorna função de unsubscribe.
 */
export const subscribeMessages = (
  cid: string,
  cb: (messages: ChatMessage[]) => void,
  pageSize = 100,
): Unsubscribe => {
  const q = query(
    collection(db, 'chats', cid, 'messages'),
    orderBy('createdAt', 'asc'),
    fbLimit(pageSize),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
  });
};

/** Inscreve-se na lista de chats do usuário (para chat list futuro). */
export const subscribeUserChats = (
  userId: string,
  cb: (chats: Chat[]) => void,
): Unsubscribe => {
  const q = query(collection(db, 'chats'), where('members', 'array-contains', userId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
    list.sort((a, b) => {
      const av = (a.lastMessageAt as { toMillis?: () => number } | null | undefined)?.toMillis?.() ?? 0;
      const bv = (b.lastMessageAt as { toMillis?: () => number } | null | undefined)?.toMillis?.() ?? 0;
      return bv - av;
    });
    cb(list);
  });
};
