/**
 * Regras oficiais de voleibol (FIVB) aplicadas ao app.
 *
 * Fonte: FIVB Official Volleyball Rules 2021-2024, capitulos 6 (Vencer
 * um lance/set/jogo) e 9 (Sistema de jogo).
 *
 * Resumo:
 * - Set normal (1-4 em melhor-de-5, ou 1-2 em melhor-de-3): 25 pontos,
 *   com margem minima de 2 pontos (joga ate alguem ter 2 a mais).
 * - Set decisivo (5o em mel-de-5, 3o em mel-de-3): 15 pontos com mesma
 *   margem de 2.
 * - Jogo: ganha quem fizer ceil(format/2) sets primeiro.
 * - Time de saque pontuou: ganha o ponto e mantem o saque.
 * - Time defendendo pontuou: ganha o ponto E ganha o saque (sideout),
 *   forcando rotacao horaria dos 6 jogadores em quadra.
 */

import { VolleyFormat, VolleyMatch, VolleySetData } from '../types';

/** Numero do set decisivo dado o formato (3o em melhor-de-3, 5o em melhor-de-5). */
export const decisiveSetNumber = (format: VolleyFormat): number => format;

/** Pontos-alvo do set atual: 25 pra sets normais, 15 pro decisivo. */
export const targetPointsForSet = (
  setNumber: number,
  format: VolleyFormat,
): number => {
  return setNumber === decisiveSetNumber(format) ? 15 : 25;
};

/**
 * Verifica se o set atual atingiu o criterio pra ser encerrado:
 * algum time tem >= target points E vantagem >= 2 pontos.
 */
export const isSetWon = (
  set: VolleySetData,
  format: VolleyFormat,
): { won: boolean; winner: 'A' | 'B' | null } => {
  const target = targetPointsForSet(set.number, format);
  const { scoreA, scoreB } = set;
  if (scoreA >= target && scoreA - scoreB >= 2) {
    return { won: true, winner: 'A' };
  }
  if (scoreB >= target && scoreB - scoreA >= 2) {
    return { won: true, winner: 'B' };
  }
  return { won: false, winner: null };
};

/** Quantos sets cada time precisa pra ganhar o jogo. */
export const setsToWinMatch = (format: VolleyFormat): number =>
  Math.ceil(format / 2);

/** Sets ja ganhos por cada time no match (consideram apenas sets finalizados). */
export const setsWonInMatch = (
  match: VolleyMatch,
): { a: number; b: number } => {
  let a = 0;
  let b = 0;
  for (const s of match.sets) {
    if (!s.finished) continue;
    if (s.scoreA > s.scoreB) a += 1;
    else if (s.scoreB > s.scoreA) b += 1;
  }
  return { a, b };
};

/** O jogo acabou (algum time atingiu ceil(format/2) sets ganhos)? */
export const isMatchWon = (
  match: VolleyMatch,
): { won: boolean; winner: 'A' | 'B' | null } => {
  const { a, b } = setsWonInMatch(match);
  const needed = setsToWinMatch(match.format);
  if (a >= needed) return { won: true, winner: 'A' };
  if (b >= needed) return { won: true, winner: 'B' };
  return { won: false, winner: null };
};

/**
 * Status do set atual pra UI: pode mostrar "MATCH POINT" quando um time
 * esta a 1 ponto de fechar o set, ou "SET POINT" quando o vencedor desse
 * set vai fechar o jogo.
 */
export type SetMomentum =
  | { kind: 'normal' }
  | { kind: 'set_point'; team: 'A' | 'B' }
  | { kind: 'match_point'; team: 'A' | 'B' };

export const setMomentum = (
  set: VolleySetData,
  match: VolleyMatch,
): SetMomentum => {
  const target = targetPointsForSet(set.number, match.format);
  const { scoreA, scoreB } = set;

  // Se algum time pode fechar o set com 1 ponto: precisa >= target-1 E
  // estar com vantagem >= 1 (porque ainda precisa 2 de diferenca pra
  // realmente fechar — mas se ele faz +1 e fica 2 a mais, fecha).
  const aCanCloseSet = scoreA >= target - 1 && scoreA + 1 - scoreB >= 2;
  const bCanCloseSet = scoreB >= target - 1 && scoreB + 1 - scoreA >= 2;

  if (!aCanCloseSet && !bCanCloseSet) return { kind: 'normal' };

  const wins = setsWonInMatch(match);
  const needed = setsToWinMatch(match.format);

  if (aCanCloseSet) {
    // Esse set fechando levaria A a quantos sets?
    if (wins.a + 1 >= needed) return { kind: 'match_point', team: 'A' };
    return { kind: 'set_point', team: 'A' };
  }
  // bCanCloseSet
  if (wins.b + 1 >= needed) return { kind: 'match_point', team: 'B' };
  return { kind: 'set_point', team: 'B' };
};
