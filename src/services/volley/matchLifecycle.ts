/**
 * Ciclo de vida da partida + controle de rotacao.
 *
 * Cobre:
 * - startVolleyMatch: 'scheduled' -> 'in_progress'
 * - finishCurrentSet: marca set fechado, abre proximo OU encerra match
 * - resetVolleyMatch: zera tudo, volta pro set 1
 * - rotacao manual e setInitialRotation
 */

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VolleyMatch } from '../../types';
import { rotateBackward, rotateForward } from '../volleyRotation';
import { buildEmptySet, cloneSets } from './matchHelpers';

/** Inicia uma partida agendada: 'scheduled' -> 'in_progress'. */
export const startVolleyMatch = async (matchId: string): Promise<void> => {
  await updateDoc(doc(db, 'volleyMatches', matchId), {
    status: 'in_progress',
    updatedAt: serverTimestamp(),
  });
};

/**
 * Finaliza o set atual e cria o proximo (se ainda houver). Marca o jogo
 * como 'finished' se o time atingiu ceil(format/2) sets vencidos.
 */
export const finishCurrentSet = async (match: VolleyMatch): Promise<void> => {
  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx < 0) return;
  sets[idx].finished = true;

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

/** Zera tudo: sets, placares, rotacao, saque e history. Volta pro set 1. */
export const resetVolleyMatch = async (match: VolleyMatch): Promise<void> => {
  const emptySet = buildEmptySet(1, match.players);
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets: [emptySet],
    currentSet: 1,
    currentRotation: [...match.initialRotation],
    rotationCount: 0,
    pointsCount: 0,
    serveTeam: 'A',
    pointHistory: [],
    status: 'in_progress',
    updatedAt: serverTimestamp(),
  });
};

/** Rotacao manual (horario). */
export const rotateManual = async (match: VolleyMatch): Promise<void> => {
  await updateDoc(doc(db, 'volleyMatches', match.id), {
    currentRotation: rotateForward(match.currentRotation),
    rotationCount: match.rotationCount + 1,
    updatedAt: serverTimestamp(),
  });
};

/** Rotacao anti-horaria (desfazer). */
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
