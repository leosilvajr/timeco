import { describe, expect, it } from '@jest/globals';
import {
  decisiveSetNumber,
  isMatchWon,
  isSetWon,
  setMomentum,
  setsToWinMatch,
  setsWonInMatch,
  targetPointsForSet,
} from './volleyRules';
import { VolleyMatch, VolleySetData } from '../types';

const emptySet = (
  number: number,
  scoreA: number,
  scoreB: number,
  finished = false,
): VolleySetData => ({
  number,
  scoreA,
  scoreB,
  finished,
  playerStats: {},
});

const makeMatch = (
  format: 3 | 5,
  sets: VolleySetData[],
): VolleyMatch => ({
  id: 'm1',
  ownerId: 'u1',
  date: '2026-01-01',
  location: 'Quadra',
  teamAName: 'A',
  teamBName: 'B',
  format,
  rotationSystem: '5x1',
  status: 'in_progress',
  currentSet: sets.length,
  players: [],
  sets,
  initialRotation: [1, 2, 3, 4, 5, 6],
  currentRotation: [1, 2, 3, 4, 5, 6],
  rotationCount: 0,
  pointsCount: 0,
  serveTeam: 'A',
  pointHistory: [],
  createdAt: Date.now() as unknown as never,
  updatedAt: Date.now() as unknown as never,
});

describe('volleyRules', () => {
  describe('targetPointsForSet', () => {
    it('normal sets (1-2) em melhor-de-3 vao ate 25', () => {
      expect(targetPointsForSet(1, 3)).toBe(25);
      expect(targetPointsForSet(2, 3)).toBe(25);
    });
    it('set decisivo (3) em melhor-de-3 vai ate 15', () => {
      expect(targetPointsForSet(3, 3)).toBe(15);
    });
    it('normal sets (1-4) em melhor-de-5 vao ate 25', () => {
      expect(targetPointsForSet(1, 5)).toBe(25);
      expect(targetPointsForSet(4, 5)).toBe(25);
    });
    it('set decisivo (5) em melhor-de-5 vai ate 15', () => {
      expect(targetPointsForSet(5, 5)).toBe(15);
    });
  });

  describe('decisiveSetNumber', () => {
    it('mel-de-3 -> 3o set', () => {
      expect(decisiveSetNumber(3)).toBe(3);
    });
    it('mel-de-5 -> 5o set', () => {
      expect(decisiveSetNumber(5)).toBe(5);
    });
  });

  describe('isSetWon', () => {
    it('25-23 ganha (margem 2)', () => {
      const r = isSetWon(emptySet(1, 25, 23), 5);
      expect(r.won).toBe(true);
      expect(r.winner).toBe('A');
    });
    it('25-24 nao ganha (margem 1 — joga ate ter 2)', () => {
      const r = isSetWon(emptySet(1, 25, 24), 5);
      expect(r.won).toBe(false);
    });
    it('26-24 ganha (margem 2 apos extensao)', () => {
      const r = isSetWon(emptySet(1, 26, 24), 5);
      expect(r.won).toBe(true);
      expect(r.winner).toBe('A');
    });
    it('B ganhando 25-22 com decisivo target 15', () => {
      // Cenario invalido na pratica mas funcao deve respeitar o target
      const r = isSetWon(emptySet(3, 22, 25), 3);
      expect(r.won).toBe(true);
      expect(r.winner).toBe('B');
    });
    it('15-13 ganha no decisivo (margem 2 em set decisivo)', () => {
      const r = isSetWon(emptySet(3, 15, 13), 3);
      expect(r.won).toBe(true);
      expect(r.winner).toBe('A');
    });
    it('15-14 nao ganha no decisivo', () => {
      const r = isSetWon(emptySet(3, 15, 14), 3);
      expect(r.won).toBe(false);
    });
    it('14-14 ainda em jogo', () => {
      const r = isSetWon(emptySet(3, 14, 14), 3);
      expect(r.won).toBe(false);
    });
  });

  describe('setsToWinMatch', () => {
    it('melhor-de-3 -> 2 sets pra ganhar', () => {
      expect(setsToWinMatch(3)).toBe(2);
    });
    it('melhor-de-5 -> 3 sets pra ganhar', () => {
      expect(setsToWinMatch(5)).toBe(3);
    });
  });

  describe('setsWonInMatch / isMatchWon', () => {
    it('soh conta sets finalizados', () => {
      const m = makeMatch(5, [
        emptySet(1, 25, 20, true),
        emptySet(2, 25, 22, true),
        emptySet(3, 18, 16, false), // nao finalizado
      ]);
      expect(setsWonInMatch(m)).toEqual({ a: 2, b: 0 });
    });
    it('match-de-3 ganha com 2 sets vencidos', () => {
      const m = makeMatch(3, [
        emptySet(1, 25, 20, true),
        emptySet(2, 25, 22, true),
      ]);
      expect(isMatchWon(m)).toEqual({ won: true, winner: 'A' });
    });
    it('match nao ganho com 1 set por lado', () => {
      const m = makeMatch(3, [
        emptySet(1, 25, 20, true),
        emptySet(2, 22, 25, true),
      ]);
      expect(isMatchWon(m)).toEqual({ won: false, winner: null });
    });
    it('match-de-5 precisa de 3 sets', () => {
      const m = makeMatch(5, [
        emptySet(1, 25, 20, true),
        emptySet(2, 25, 22, true),
        emptySet(3, 25, 18, true),
      ]);
      expect(isMatchWon(m)).toEqual({ won: true, winner: 'A' });
    });
  });

  describe('setMomentum', () => {
    it('placar normal — kind: normal', () => {
      const m = makeMatch(5, [emptySet(1, 10, 8)]);
      expect(setMomentum(m.sets[0], m)).toEqual({ kind: 'normal' });
    });
    it('24-22 — set point pra A', () => {
      const m = makeMatch(5, [emptySet(1, 24, 22)]);
      expect(setMomentum(m.sets[0], m)).toEqual({ kind: 'set_point', team: 'A' });
    });
    it('24-24 — ninguem em set point (precisa 2 de vantagem com +1)', () => {
      const m = makeMatch(5, [emptySet(1, 24, 24)]);
      expect(setMomentum(m.sets[0], m)).toEqual({ kind: 'normal' });
    });
    it('25-23 — A ja ganhou (won) mas momentum nao retorna ganho — caller usa isSetWon', () => {
      const m = makeMatch(5, [emptySet(1, 25, 23)]);
      // Mesmo com set ganho, momentum apenas reflete "estaria em set point pra mais 1"
      // Funcao nao bloqueia esse caso porque o caller deve chamar isSetWon antes
      const r = setMomentum(m.sets[0], m);
      expect(r.kind).toBe('set_point');
    });
    it('decisivo 14-13 — match point pra A (set point + ganha tudo)', () => {
      const m = makeMatch(3, [
        emptySet(1, 25, 20, true),
        emptySet(2, 22, 25, true),
        emptySet(3, 14, 13),
      ]);
      expect(setMomentum(m.sets[2], m)).toEqual({ kind: 'match_point', team: 'A' });
    });
    it('2o set 24-22 com mel-de-3 e A ja venceu o 1o — match point pra A', () => {
      const m = makeMatch(3, [
        emptySet(1, 25, 20, true),
        emptySet(2, 24, 22),
      ]);
      expect(setMomentum(m.sets[1], m)).toEqual({ kind: 'match_point', team: 'A' });
    });
  });
});
