/**
 * Bloqueio de usuarios — ferramenta de moderacao do proprio user.
 *
 * Quando A bloqueia B:
 * - A nao ve mais mensagens de B (chat fica filtrado client-side)
 * - A nao ve mais o perfil de B
 * - A nao ve fotos enviadas por B em eventos
 * - B NAO sabe (silencioso — boa pratica vs assedio)
 *
 * Bloqueio e por-usuario (assimetrico). Doc em:
 *   users/{userId}/blocked/{blockedUserId}
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { BlockedUser } from '../types';

const blockedCol = (userId: string) =>
  collection(db, 'users', userId, 'blocked');

export const blockUser = async (
  userId: string,
  blockedUserId: string,
  blockedUserName?: string,
): Promise<void> => {
  await setDoc(doc(blockedCol(userId), blockedUserId), {
    blockedUserId,
    blockedUserName: blockedUserName || null,
    createdAt: serverTimestamp(),
  });
};

export const unblockUser = async (
  userId: string,
  blockedUserId: string,
): Promise<void> => {
  await deleteDoc(doc(blockedCol(userId), blockedUserId));
};

export const listBlockedUsers = async (userId: string): Promise<BlockedUser[]> => {
  const snap = await getDocs(blockedCol(userId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlockedUser));
};

/** Helper sincrono: dado um Set de UIDs bloqueados, retorna se um UID alvo esta bloqueado. */
export const isBlocked = (blockedIds: Set<string>, targetUid: string): boolean =>
  blockedIds.has(targetUid);
