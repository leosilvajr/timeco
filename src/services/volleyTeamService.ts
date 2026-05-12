import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { VolleyTeam, VolleyPlayer } from '../types';

export interface CreateVolleyTeamInput {
  ownerId: string;
  name: string;
  players: VolleyPlayer[];
}

/**
 * Cria um time de volei novo no Firestore. Retorna o ID gerado.
 */
export const createVolleyTeam = async (input: CreateVolleyTeamInput): Promise<string> => {
  const ref = await addDoc(collection(db, 'volleyTeams'), {
    ownerId: input.ownerId,
    name: input.name.trim(),
    players: input.players,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Atualiza nome e/ou jogadores de um time existente.
 */
export const updateVolleyTeam = async (
  teamId: string,
  patch: { name?: string; players?: VolleyPlayer[] },
): Promise<void> => {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.players !== undefined) data.players = patch.players;
  await updateDoc(doc(db, 'volleyTeams', teamId), data);
};

export const deleteVolleyTeam = async (teamId: string): Promise<void> => {
  await deleteDoc(doc(db, 'volleyTeams', teamId));
};

export const getVolleyTeam = async (teamId: string): Promise<VolleyTeam | null> => {
  const snap = await getDoc(doc(db, 'volleyTeams', teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as VolleyTeam;
};

/**
 * Lista todos os times do usuario, mais recentes primeiro.
 */
export const listUserVolleyTeams = async (ownerId: string): Promise<VolleyTeam[]> => {
  const q = query(
    collection(db, 'volleyTeams'),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as VolleyTeam));
};
