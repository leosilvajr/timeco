import {
  accumulateAcrossSets,
  applyAction,
  attackPercentage,
  blockPercentage,
  directPoints,
  emptyPlayerStats,
  overallEfficiency,
  passPercentage,
  servePercentage,
  setPercentage,
  sumPlayerStats,
  teamSummary,
  totalAttacks,
  totalErrors,
  totalPasses,
  totalServes,
} from './volleyStats';
import { PlayerVolleyStats, VolleyAction, VolleySetData } from '../types';

describe('emptyPlayerStats', () => {
  it('inicia todos os contadores em zero', () => {
    const s = emptyPlayerStats();
    expect(s.attacks.success).toBe(0);
    expect(s.attacks.error).toBe(0);
    expect(s.attacks.normal).toBe(0);
    expect(s.serves.success).toBe(0);
    expect(s.serves.ace).toBe(0);
    expect(s.passes.a).toBe(0);
    expect(s.sets.fundo_saida).toBe(0);
  });
});

describe('applyAction', () => {
  it('incrementa o contador correto para cada ação', () => {
    let s = emptyPlayerStats();
    const cases: Array<[VolleyAction, (s: PlayerVolleyStats) => number]> = [
      ['serve_success', (x) => x.serves.success],
      ['serve_error', (x) => x.serves.error],
      ['ace', (x) => x.serves.ace],
      ['attack_point', (x) => x.attacks.success],
      ['attack', (x) => x.attacks.normal],
      ['attack_error', (x) => x.attacks.error],
      ['block_success', (x) => x.blocks.success],
      ['block_error', (x) => x.blocks.error],
      ['pass_a', (x) => x.passes.a],
      ['pass_b', (x) => x.passes.b],
      ['pass_c', (x) => x.passes.c],
      ['set_success', (x) => x.sets.success],
      ['set_error', (x) => x.sets.error],
      ['set_ponta', (x) => x.sets.ponta],
      ['set_saida', (x) => x.sets.saida],
      ['set_meio', (x) => x.sets.meio],
      ['set_fundo_meio', (x) => x.sets.fundo_meio],
      ['set_fundo_saida', (x) => x.sets.fundo_saida],
    ];
    for (const [action, get] of cases) {
      const before = get(s);
      s = applyAction(s, action);
      expect(get(s)).toBe(before + 1);
    }
  });

  it('é imutável (retorna novo objeto)', () => {
    const original = emptyPlayerStats();
    const next = applyAction(original, 'ace');
    expect(original.serves.ace).toBe(0);
    expect(next.serves.ace).toBe(1);
    expect(next).not.toBe(original);
  });

  it('delta -1 decrementa mas nunca produz negativo', () => {
    const s0 = emptyPlayerStats();
    const minusOne = applyAction(s0, 'ace', -1);
    expect(minusOne.serves.ace).toBe(0);

    const plusOne = applyAction(s0, 'ace');
    const back = applyAction(plusOne, 'ace', -1);
    expect(back.serves.ace).toBe(0);
  });
});

describe('totals', () => {
  let stats: PlayerVolleyStats;
  beforeEach(() => {
    stats = emptyPlayerStats();
    stats = applyAction(stats, 'attack_point');
    stats = applyAction(stats, 'attack_point');
    stats = applyAction(stats, 'attack');
    stats = applyAction(stats, 'attack_error');
    stats = applyAction(stats, 'serve_success');
    stats = applyAction(stats, 'ace');
    stats = applyAction(stats, 'serve_error');
    stats = applyAction(stats, 'pass_a');
    stats = applyAction(stats, 'pass_b');
    stats = applyAction(stats, 'pass_c');
  });

  it('totalAttacks soma success + error + normal', () => {
    expect(totalAttacks(stats)).toBe(4);
  });

  it('totalServes soma success + error + ace', () => {
    expect(totalServes(stats)).toBe(3);
  });

  it('totalPasses soma a + b + c', () => {
    expect(totalPasses(stats)).toBe(3);
  });
});

describe('percentuais', () => {
  it('attackPercentage = success / total * 100', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'attack_point'); // 1 success
    s = applyAction(s, 'attack');       // 1 normal
    s = applyAction(s, 'attack_error'); // 1 error
    expect(attackPercentage(s)).toBeCloseTo(100 / 3, 4);
  });

  it('servePercentage conta success + ace como bons', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'serve_success');
    s = applyAction(s, 'ace');
    s = applyAction(s, 'serve_error');
    // 2 bons em 3 → 66.66...%
    expect(servePercentage(s)).toBeCloseTo(200 / 3, 4);
  });

  it('passPercentage conta A + B como bons', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'pass_a');
    s = applyAction(s, 'pass_b');
    s = applyAction(s, 'pass_c');
    s = applyAction(s, 'pass_c');
    // 2 bons em 4 = 50%
    expect(passPercentage(s)).toBe(50);
  });

  it('blockPercentage = success / (success + error)', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'block_success');
    s = applyAction(s, 'block_success');
    s = applyAction(s, 'block_error');
    expect(blockPercentage(s)).toBeCloseTo(200 / 3, 4);
  });

  it('setPercentage = success / (success + error)', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'set_success');
    s = applyAction(s, 'set_success');
    s = applyAction(s, 'set_success');
    s = applyAction(s, 'set_error');
    expect(setPercentage(s)).toBe(75);
  });

  it('todos retornam 0 quando não há ações', () => {
    const s = emptyPlayerStats();
    expect(attackPercentage(s)).toBe(0);
    expect(servePercentage(s)).toBe(0);
    expect(passPercentage(s)).toBe(0);
    expect(blockPercentage(s)).toBe(0);
    expect(setPercentage(s)).toBe(0);
  });
});

describe('directPoints e overallEfficiency', () => {
  it('directPoints = ataques bem sucedidos + aces', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'attack_point');
    s = applyAction(s, 'attack_point');
    s = applyAction(s, 'ace');
    s = applyAction(s, 'serve_success'); // não conta
    expect(directPoints(s)).toBe(3);
  });

  it('overallEfficiency = directPoints / totalActions', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'attack_point'); // direto
    s = applyAction(s, 'attack_point'); // direto
    s = applyAction(s, 'attack_error'); // só ação, não direto
    // total = 3, directos = 2 → 66.66%
    expect(overallEfficiency(s)).toBeCloseTo(200 / 3, 4);
  });

  it('totalErrors soma erros de todas as categorias', () => {
    let s = emptyPlayerStats();
    s = applyAction(s, 'attack_error');
    s = applyAction(s, 'serve_error');
    s = applyAction(s, 'block_error');
    s = applyAction(s, 'set_error');
    expect(totalErrors(s)).toBe(4);
  });
});

describe('sumPlayerStats e accumulateAcrossSets', () => {
  it('sumPlayerStats soma campo a campo', () => {
    let a = emptyPlayerStats();
    a = applyAction(a, 'ace');
    a = applyAction(a, 'attack_point');

    let b = emptyPlayerStats();
    b = applyAction(b, 'ace');
    b = applyAction(b, 'pass_a');

    const merged = sumPlayerStats(a, b);
    expect(merged.serves.ace).toBe(2);
    expect(merged.attacks.success).toBe(1);
    expect(merged.passes.a).toBe(1);
  });

  it('accumulateAcrossSets soma stats do mesmo jogador entre sets', () => {
    const set1Stats = applyAction(emptyPlayerStats(), 'ace');
    const set2Stats = applyAction(emptyPlayerStats(), 'ace');
    const set3Stats = applyAction(emptyPlayerStats(), 'attack_point');

    const sets: VolleySetData[] = [
      { number: 1, scoreA: 25, scoreB: 20, finished: true, playerStats: { 7: set1Stats } },
      { number: 2, scoreA: 21, scoreB: 25, finished: true, playerStats: { 7: set2Stats } },
      { number: 3, scoreA: 25, scoreB: 22, finished: true, playerStats: { 7: set3Stats } },
    ];
    const acc = accumulateAcrossSets(sets, 7);
    expect(acc.serves.ace).toBe(2);
    expect(acc.attacks.success).toBe(1);
  });

  it('accumulateAcrossSets ignora jogadores ausentes em algum set', () => {
    const sets: VolleySetData[] = [
      { number: 1, scoreA: 25, scoreB: 20, finished: true, playerStats: { 7: applyAction(emptyPlayerStats(), 'ace') } },
      { number: 2, scoreA: 21, scoreB: 25, finished: true, playerStats: {} }, // sem stats do 7
    ];
    const acc = accumulateAcrossSets(sets, 7);
    expect(acc.serves.ace).toBe(1);
  });
});

describe('teamSummary', () => {
  it('agrega stats de múltiplos jogadores em um resumo', () => {
    const p1 = applyAction(applyAction(emptyPlayerStats(), 'attack_point'), 'ace');
    const p2 = applyAction(applyAction(emptyPlayerStats(), 'block_success'), 'attack_error');
    const p3 = applyAction(emptyPlayerStats(), 'serve_error');

    const summary = teamSummary({ 1: p1, 2: p2, 3: p3 });
    // pontos diretos: p1 (1 atk + 1 ace) + p2 (0) + p3 (0) = 2
    expect(summary.totalPoints).toBe(2);
    expect(summary.totalAces).toBe(1);
    expect(summary.totalBlocks).toBe(1);
    // erros: p1 (0) + p2 (1 atk error) + p3 (1 serve error) = 2
    expect(summary.totalErrors).toBe(2);
  });

  it('zera quando não há jogadores', () => {
    const s = teamSummary({});
    expect(s).toEqual({ totalPoints: 0, totalAces: 0, totalBlocks: 0, totalErrors: 0 });
  });
});
