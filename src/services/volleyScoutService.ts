import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  PlayerVolleyStats,
  VolleyAction,
  VolleyFormat,
  VolleyMatch,
  VolleyPlayer,
  VolleyPointHistoryEntry,
  VolleyRotationSystem,
  VolleySetData,
} from '../types';
import { applyAction, emptyPlayerStats } from './volleyStats';
import { applyPoint, defaultRotation, rotateBackward, rotateForward } from './volleyRotation';

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

const buildEmptySet = (
  setNumber: number,
  players: VolleyPlayer[],
): VolleySetData => {
  const playerStats: Record<number, PlayerVolleyStats> = {};
  for (const p of players) playerStats[p.number] = emptyPlayerStats();
  return {
    number: setNumber,
    scoreA: 0,
    scoreB: 0,
    finished: false,
    playerStats,
  };
};

export const createVolleyMatch = async (input: CreateVolleyMatchInput): Promise<string> => {
  const initialRotation = defaultRotation(input.players.map((p) => p.number));
  const ref = await addDoc(collection(db, 'volleyMatches'), {
    ownerId: input.ownerId,
    date: input.date,
    location: input.location,
    teamAName: input.teamAName,
    teamBName: input.teamBName,
    format: input.format,
    rotationSystem: input.rotationSystem,
    status: 'in_progress',
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

export const getVolleyMatch = async (matchId: string): Promise<VolleyMatch | null> => {
  const snap = await getDoc(doc(db, 'volleyMatches', matchId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as VolleyMatch;
};

export const listUserVolleyMatches = async (ownerId: string): Promise<VolleyMatch[]> => {
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

const cloneSets = (sets: VolleySetData[]): VolleySetData[] =>
  sets.map((s) => ({
    ...s,
    playerStats: Object.fromEntries(
      Object.entries(s.playerStats).map(([k, v]) => [k, { ...v, attacks: { ...v.attacks }, serves: { ...v.serves }, blocks: { ...v.blocks }, passes: { ...v.passes }, sets: { ...v.sets } }]),
    ),
  }));

/** Aplica uma ação ao set atual e persiste. */
export const recordAction = async (
  match: VolleyMatch,
  playerNumber: number,
  action: VolleyAction,
  delta: 1 | -1 = 1,
): Promise<void> => {
  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx < 0) return;
  const current = sets[idx];
  const ps = current.playerStats[playerNumber] ?? emptyPlayerStats();
  current.playerStats[playerNumber] = applyAction(ps, action, delta);
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets,
    updatedAt: serverTimestamp(),
  });
};

/** Atualiza placar do set atual (ex.: usuário ajusta placar manualmente). */
export const updateScore = async (
  match: VolleyMatch,
  team: 'A' | 'B',
  delta: number,
): Promise<void> => {
  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx < 0) return;
  const cur = sets[idx];
  if (team === 'A') cur.scoreA = Math.max(0, cur.scoreA + delta);
  else cur.scoreB = Math.max(0, cur.scoreB + delta);
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets,
    updatedAt: serverTimestamp(),
  });
};

/** Registra ponto (incrementa placar + atualiza saque + rotação se auto). */
export const registerPoint = async (
  match: VolleyMatch,
  pointTeam: 'A' | 'B',
  autoRotation: boolean,
): Promise<void> => {
  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx < 0) return;
  const cur = sets[idx];
  if (pointTeam === 'A') cur.scoreA += 1;
  else cur.scoreB += 1;

  const before: VolleyPointHistoryEntry = {
    team: pointTeam,
    rotationBefore: [...match.currentRotation],
    serveBefore: match.serveTeam,
  };
  const result = applyPoint(match.currentRotation, match.serveTeam, pointTeam, autoRotation);

  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets,
    currentRotation: result.rotation,
    serveTeam: result.serveTeam,
    pointsCount: match.pointsCount + 1,
    rotationCount: result.rotated ? match.rotationCount + 1 : match.rotationCount,
    pointHistory: [...match.pointHistory, before],
    updatedAt: serverTimestamp(),
  });
};

/** Desfaz o último ponto registrado (ajusta placar, rotação e saque). */
export const undoLastPoint = async (match: VolleyMatch): Promise<void> => {
  if (match.pointHistory.length === 0) return;
  const last = match.pointHistory[match.pointHistory.length - 1];

  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx >= 0) {
    if (last.team === 'A') sets[idx].scoreA = Math.max(0, sets[idx].scoreA - 1);
    else sets[idx].scoreB = Math.max(0, sets[idx].scoreB - 1);
  }
  const newHistory = match.pointHistory.slice(0, -1);
  // Se ANTES do ponto desfeito a rotação era diferente da atual, foi sideout com rotação.
  const rotated =
    last.rotationBefore.some((v, i) => v !== match.currentRotation[i]);

  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets,
    currentRotation: last.rotationBefore,
    serveTeam: last.serveBefore,
    pointsCount: Math.max(0, match.pointsCount - 1),
    rotationCount: rotated ? Math.max(0, match.rotationCount - 1) : match.rotationCount,
    pointHistory: newHistory,
    updatedAt: serverTimestamp(),
  });
};

/** Rotação manual (horário). */
export const rotateManual = async (match: VolleyMatch): Promise<void> => {
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    currentRotation: rotateForward(match.currentRotation),
    rotationCount: match.rotationCount + 1,
    updatedAt: serverTimestamp(),
  });
};

/** Rotação anti-horária (desfazer). */
export const rotateManualBack = async (match: VolleyMatch): Promise<void> => {
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    currentRotation: rotateBackward(match.currentRotation),
    rotationCount: Math.max(0, match.rotationCount - 1),
    updatedAt: serverTimestamp(),
  });
};

export const resetRotation = async (match: VolleyMatch): Promise<void> => {
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    currentRotation: [...match.initialRotation],
    rotationCount: 0,
    updatedAt: serverTimestamp(),
  });
};

export const setInitialRotation = async (
  match: VolleyMatch,
  newInitial: number[],
): Promise<void> => {
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    initialRotation: newInitial,
    currentRotation: newInitial,
    rotationCount: 0,
    updatedAt: serverTimestamp(),
  });
};

/** Finaliza o set atual e cria o próximo (se ainda houver). Marca jogo finalizado se atingir o formato. */
export const finishCurrentSet = async (match: VolleyMatch): Promise<void> => {
  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx < 0) return;
  sets[idx].finished = true;

  // Decide se o jogo acabou: time precisa de ceil(format/2) sets para vencer.
  const setsA = sets.filter((s) => s.finished && s.scoreA > s.scoreB).length;
  const setsB = sets.filter((s) => s.finished && s.scoreB > s.scoreA).length;
  const needed = Math.ceil(match.format / 2);

  if (setsA >= needed || setsB >= needed) {
    await updateDoc(doc(db, 'volleyMatches', match.id), {
      sets,
      status: 'finished',
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // Cria próximo set vazio com rotação resetada para a inicial.
  const nextNumber = match.currentSet + 1;
  if (nextNumber > match.format) {
    await updateDoc(doc(db, 'volleyMatches', match.id), {
      sets,
      status: 'finished',
      updatedAt: serverTimestamp(),
    });
    return;
  }
  sets.push(buildEmptySet(nextNumber, match.players));
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets,
    currentSet: nextNumber,
    currentRotation: [...match.initialRotation],
    rotationCount: 0,
    pointsCount: 0,
    serveTeam: 'A',
    pointHistory: [],
    updatedAt: serverTimestamp(),
  });
};
