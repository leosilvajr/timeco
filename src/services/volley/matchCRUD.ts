/**
 * CRUD basico das partidas de volei no Firestore.
 *
 * Cobertura:
 * - create / get / list / subscribe / delete
 *
 * Nao inclui: pontuacao (volley/scoutActions.ts), ciclo de vida ou
 * rotacao (volley/matchLifecycle.ts).
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  VolleyFormat,
  VolleyMatch,
  VolleyPlayer,
  VolleyRotationSystem,
} from '../../types';
import { defaultRotation } from '../volleyRotation';
import { buildEmptySet, todayISO } from './matchHelpers';

export interface CreateVolleyMatchInput {
  ownerId: string;
  date: string;
  location: string;
  teamAName: string;
  teamBName: string;
  format: VolleyFormat;
  rotationSystem: VolleyRotationSystem;
  players: VolleyPlayer[];
}

export const createVolleyMatch = async (
  input: CreateVolleyMatchInput,
): Promise<string> => {
  const initialRotation = defaultRotation(input.players.map((p) => p.number));
  // Data futura -> 'scheduled' (Em breve). Mesma data ou passada -> 'in_progress' direto.
  const status = input.date > todayISO() ? 'scheduled' : 'in_progress';
  const ref = await addDoc(collection(db, 'volleyMatches'), {
    ownerId: input.ownerId,
    date: input.date,
    location: input.location,
    teamAName: input.teamAName,
    teamBName: input.teamBName,
    format: input.format,
    rotationSystem: input.rotationSystem,
    status,
    currentSet: 1,
    players: input.players,
    sets: [buildEmptySet(1, input.players)],
    initialRotation,
    currentRotation: initialRotation,
    rotationCount: 0,
    pointsCount: 0,
    serveTeam: 'A',
    pointHistory: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getVolleyMatch = async (
  matchId: string,
): Promise<VolleyMatch | null> => {
  const snap = await getDoc(doc(db, 'volleyMatches', matchId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as VolleyMatch;
};

export const listUserVolleyMatches = async (
  ownerId: string,
): Promise<VolleyMatch[]> => {
  const snap = await getDocs(
    query(
      collection(db, 'volleyMatches'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as VolleyMatch));
};

export const subscribeVolleyMatch = (
  matchId: string,
  cb: (m: VolleyMatch | null) => void,
): Unsubscribe => {
  return onSnapshot(doc(db, 'volleyMatches', matchId), (snap) => {
    if (!snap.exists()) cb(null);
    else cb({ id: snap.id, ...snap.data() } as VolleyMatch);
  });
};

export const deleteVolleyMatch = async (matchId: string): Promise<void> => {
  await deleteDoc(doc(db, 'volleyMatches', matchId));
};
