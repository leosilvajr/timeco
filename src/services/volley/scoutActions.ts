/**
 * Acoes de pontuacao do scout: registra/desfaz acoes do jogador, atualiza
 * placar/rotacao quando aplicavel. Inclui versao PURA (previewScoutAction)
 * pra UI otimista.
 */

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  VolleyAction,
  VolleyMatch,
  VolleyPointHistoryEntry,
} from '../../types';
import { applyAction, emptyPlayerStats } from '../volleyStats';
import { applyPoint } from '../volleyRotation';
import { cloneSets } from './matchHelpers';

/**
 * Mapa de acao -> impacto no placar:
 * - 'A' = ponto pra nossa equipe
 * - 'B' = ponto pra equipe adversaria
 * - null = stats only (nao muda placar)
 */
export const actionScoreImpact: Record<VolleyAction, 'A' | 'B' | null> = {
  serve_success: null,
  serve_error: 'B',
  ace: 'A',
  attack_point: 'A',
  attack: null,
  attack_error: 'B',
  pass_a: null,
  pass_b: null,
  pass_c: null,
  pass_error: 'B',
  block_success: 'A',
  block_normal: null,
  block_error: 'B',
  set_success: null,
  set_error: null,
  set_ponta: null,
  set_saida: null,
  set_meio: null,
  set_fundo_meio: null,
  set_fundo_saida: null,
  set_dump_point: 'A',   // Bola de 2a com ponto -> pra nos
  set_dump: null,        // Bola de 2a defendida -> stats only
  set_dump_error: 'B',   // Bola de 2a errada -> ponto contra
};

/**
 * Versao PURA do performScoutAction: calcula o novo estado do match sem
 * tocar no Firestore. Usado pra renderizar UI otimista (instantanea)
 * antes da persistencia voltar.
 *
 * Retorna `null` se a acao nao puder ser aplicada (ex.: set nao encontrado).
 */
export const previewScoutAction = (
  match: VolleyMatch,
  playerNumber: number,
  action: VolleyAction,
  delta: 1 | -1 = 1,
  autoRotation: boolean = true,
): VolleyMatch | null => {
  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx < 0) return null;
  const current = sets[idx];

  const ps = current.playerStats[playerNumber] ?? emptyPlayerStats();
  current.playerStats[playerNumber] = applyAction(ps, action, delta);

  const scoreImpact = actionScoreImpact[action];
  if (!scoreImpact) {
    return { ...match, sets };
  }

  if (delta === 1) {
    if (scoreImpact === 'A') current.scoreA += 1;
    else current.scoreB += 1;
    const before: VolleyPointHistoryEntry = {
      team: scoreImpact,
      rotationBefore: [...match.currentRotation],
      serveBefore: match.serveTeam,
    };
    const result = applyPoint(
      match.currentRotation,
      match.serveTeam,
      scoreImpact,
      autoRotation,
    );
    return {
      ...match,
      sets,
      currentRotation: result.rotation,
      serveTeam: result.serveTeam,
      pointsCount: match.pointsCount + 1,
      rotationCount: result.rotated
        ? match.rotationCount + 1
        : match.rotationCount,
      pointHistory: [...match.pointHistory, before],
    };
  }

  // UNDO (delta = -1)
  if (scoreImpact === 'A') current.scoreA = Math.max(0, current.scoreA - 1);
  else current.scoreB = Math.max(0, current.scoreB - 1);

  const history = [...match.pointHistory];
  let restoredRotation: number[] | null = null;
  let restoredServe: 'A' | 'B' | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].team === scoreImpact) {
      restoredRotation = history[i].rotationBefore;
      restoredServe = history[i].serveBefore;
      history.splice(i, 1);
      break;
    }
  }

  const out: VolleyMatch = {
    ...match,
    sets,
    pointsCount: Math.max(0, match.pointsCount - 1),
    pointHistory: history,
  };
  if (restoredRotation) {
    const rotated = restoredRotation.some(
      (v, i) => v !== match.currentRotation[i],
    );
    out.currentRotation = restoredRotation;
    out.rotationCount = rotated
      ? Math.max(0, match.rotationCount - 1)
      : match.rotationCount;
  }
  if (restoredServe) {
    out.serveTeam = restoredServe;
  }
  return out;
};

/**
 * Acao de scout completa: atualiza stats do jogador + placar/rotacao
 * se a acao impacta o jogo, tudo num unico updateDoc atomico.
 *
 * - delta=+1: registra acao
 * - delta=-1: desfaz acao (decrementa stats + reverte ponto se aplicavel)
 *
 * Defense-in-depth: nao escreve em partida finalizada (status === 'finished').
 */
export const performScoutAction = async (
  match: VolleyMatch,
  playerNumber: number,
  action: VolleyAction,
  delta: 1 | -1 = 1,
  autoRotation: boolean = true,
): Promise<void> => {
  if (match.status === 'finished') return;
  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx < 0) return;
  const current = sets[idx];

  const ps = current.playerStats[playerNumber] ?? emptyPlayerStats();
  current.playerStats[playerNumber] = applyAction(ps, action, delta);

  const scoreImpact = actionScoreImpact[action];

  if (!scoreImpact) {
    await updateDoc(doc(db, 'volleyMatches', match.id), {
      sets,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  if (delta === 1) {
    if (scoreImpact === 'A') current.scoreA += 1;
    else current.scoreB += 1;
    const before: VolleyPointHistoryEntry = {
      team: scoreImpact,
      rotationBefore: [...match.currentRotation],
      serveBefore: match.serveTeam,
    };
    const result = applyPoint(
      match.currentRotation,
      match.serveTeam,
      scoreImpact,
      autoRotation,
    );
    await updateDoc(doc(db, 'volleyMatches', match.id), {
      sets,
      currentRotation: result.rotation,
      serveTeam: result.serveTeam,
      pointsCount: match.pointsCount + 1,
      rotationCount: result.rotated
        ? match.rotationCount + 1
        : match.rotationCount,
      pointHistory: [...match.pointHistory, before],
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // UNDO (delta = -1)
  if (scoreImpact === 'A') current.scoreA = Math.max(0, current.scoreA - 1);
  else current.scoreB = Math.max(0, current.scoreB - 1);

  const history = [...match.pointHistory];
  let restoredRotation: number[] | null = null;
  let restoredServe: 'A' | 'B' | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].team === scoreImpact) {
      restoredRotation = history[i].rotationBefore;
      restoredServe = history[i].serveBefore;
      history.splice(i, 1);
      break;
    }
  }

  const patch: Record<string, unknown> = {
    sets,
    pointsCount: Math.max(0, match.pointsCount - 1),
    pointHistory: history,
    updatedAt: serverTimestamp(),
  };
  if (restoredRotation) {
    const rotated = restoredRotation.some(
      (v, i) => v !== match.currentRotation[i],
    );
    patch.currentRotation = restoredRotation;
    patch.rotationCount = rotated
      ? Math.max(0, match.rotationCount - 1)
      : match.rotationCount;
  }
  if (restoredServe) {
    patch.serveTeam = restoredServe;
  }

  await updateDoc(doc(db, 'volleyMatches', match.id), patch);
};

/** Aplica uma acao ao set atual e persiste — sem mexer no placar. */
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

/** Atualiza placar do set atual (ex.: usuario ajusta placar manualmente). */
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

/** Registra ponto (incrementa placar + atualiza saque + rotacao se auto). */
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
  const result = applyPoint(
    match.currentRotation,
    match.serveTeam,
    pointTeam,
    autoRotation,
  );

  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets,
    currentRotation: result.rotation,
    serveTeam: result.serveTeam,
    pointsCount: match.pointsCount + 1,
    rotationCount: result.rotated
      ? match.rotationCount + 1
      : match.rotationCount,
    pointHistory: [...match.pointHistory, before],
    updatedAt: serverTimestamp(),
  });
};

/** Desfaz o ultimo ponto registrado (ajusta placar, rotacao e saque). */
export const undoLastPoint = async (match: VolleyMatch): Promise<void> => {
  if (match.pointHistory.length === 0) return;
  const last = match.pointHistory[match.pointHistory.length - 1];

  const sets = cloneSets(match.sets);
  const idx = sets.findIndex((s) => s.number === match.currentSet);
  if (idx >= 0) {
    if (last.team === 'A')
      sets[idx].scoreA = Math.max(0, sets[idx].scoreA - 1);
    else sets[idx].scoreB = Math.max(0, sets[idx].scoreB - 1);
  }
  const newHistory = match.pointHistory.slice(0, -1);
  const rotated = last.rotationBefore.some(
    (v, i) => v !== match.currentRotation[i],
  );

  await updateDoc(doc(db, 'volleyMatches', match.id), {
    sets,
    currentRotation: last.rotationBefore,
    serveTeam: last.serveBefore,
    pointsCount: Math.max(0, match.pointsCount - 1),
    rotationCount: rotated
      ? Math.max(0, match.rotationCount - 1)
      : match.rotationCount,
    pointHistory: newHistory,
    updatedAt: serverTimestamp(),
  });
};
