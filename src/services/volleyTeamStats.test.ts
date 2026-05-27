import { describe, expect, it } from '@jest/globals';
import {
  aggregatePlayerStats,
  matchOutcome,
  matchesForTeam,
  teamEfficiencies,
  teamOverview,
  topPerformers,
} from './volleyTeamStats';
import { applyAction, emptyPlayerStats } from './volleyStats';
import { VolleyMatch, VolleyPlayer, VolleySetData } from '../types';

const buildPlayer = (
  number: number,
  name: string,
  position: VolleyPlayer['position'] = 'Ponteiro',
): VolleyPlayer => ({ number, name, position });

const buildSet = (
  number: number,
  scoreA: number,
  scoreB: number,
  finished = true,
  playerStats: Record<number, ReturnType<typeof emptyPlayerStats>> = {},
): VolleySetData => ({
  number,
  scoreA,
  scoreB,
  finished,
  playerStats,
});

const buildMatch = (
  id: string,
  teamAName: string,
  sets: VolleySetData[],
  status: VolleyMatch['status'] = 'finished',
  players: VolleyPlayer[] = [],
  date = '2026-01-01',
): VolleyMatch => ({
  id,
  ownerId: 'u1',
  date,
  location: 'X',
  teamAName,
  teamBName: 'Adversario',
  format: 3,
  rotationSystem: '5x1',
  status,
  currentSet: sets.length,
  players,
  sets,
  initialRotation: [1, 2, 3, 4, 5, 6],
  currentRotation: [1, 2, 3, 4, 5, 6],
  rotationCount: 0,
  pointsCount: 0,
  serveTeam: 'A',
  pointHistory: [],
  createdAt: null,
  updatedAt: null,
});

describe('matchesForTeam', () => {
  it('filtra partidas pelo nome do time (case-insensitive)', () => {
    const all = [
      buildMatch('m1', 'Tanabeach', []),
      buildMatch('m2', 'Outro Time', []),
      buildMatch('m3', 'tanabeach', []), // case diferente
      buildMatch('m4', '  Tanabeach  ', []), // com espaços
    ];
    const result = matchesForTeam(all, 'Tanabeach');
    expect(result.map((m) => m.id)).toEqual(['m1', 'm3', 'm4']);
  });

  it('retorna array vazio quando nenhum bate', () => {
    expect(matchesForTeam([buildMatch('m1', 'Tanabeach', [])], 'Outro')).toEqual([]);
  });

  it('retorna array vazio com input vazio', () => {
    expect(matchesForTeam([], 'qualquer')).toEqual([]);
  });
});

describe('matchOutcome', () => {
  it('conta sets ganhos por A e B baseado em scores', () => {
    const m = buildMatch('m1', 'A', [
      buildSet(1, 25, 20, true),
      buildSet(2, 22, 25, true),
      buildSet(3, 15, 10, true),
    ]);
    const o = matchOutcome(m);
    expect(o.setsA).toBe(2);
    expect(o.setsB).toBe(1);
  });

  it('soma pontuação total (todos os sets, finalizados ou nao)', () => {
    const m = buildMatch('m1', 'A', [
      buildSet(1, 25, 20, true),
      buildSet(2, 22, 25, true),
      buildSet(3, 10, 8, false),
    ]);
    const o = matchOutcome(m);
    expect(o.pointsA).toBe(57);
    expect(o.pointsB).toBe(53);
  });

  it('ignora set nao finalizado pra contagem de sets', () => {
    const m = buildMatch('m1', 'A', [
      buildSet(1, 25, 20, true),
      buildSet(2, 18, 16, false), // em andamento
    ]);
    const o = matchOutcome(m);
    expect(o.setsA).toBe(1);
    expect(o.setsB).toBe(0);
  });

  it('won=true quando A vence mais sets em partida finalizada', () => {
    const m = buildMatch(
      'm1',
      'A',
      [buildSet(1, 25, 20, true), buildSet(2, 25, 22, true)],
      'finished',
    );
    expect(matchOutcome(m).won).toBe(true);
  });

  it('won=false quando B vence', () => {
    const m = buildMatch(
      'm1',
      'A',
      [buildSet(1, 20, 25, true), buildSet(2, 22, 25, true)],
      'finished',
    );
    expect(matchOutcome(m).won).toBe(false);
  });

  it('won=null se status nao e finished', () => {
    const m = buildMatch(
      'm1',
      'A',
      [buildSet(1, 25, 20, true)],
      'in_progress',
    );
    expect(matchOutcome(m).won).toBeNull();
  });
});

describe('teamOverview', () => {
  it('zera tudo quando nao tem partidas', () => {
    const o = teamOverview([]);
    expect(o).toMatchObject({
      totalMatches: 0,
      finished: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      setsWon: 0,
      setsLost: 0,
      pointsScored: 0,
      pointsConceded: 0,
      recentForm: [],
    });
  });

  it('soma vitorias/derrotas/sets/pontos corretamente', () => {
    const m1 = buildMatch('m1', 'A', [
      buildSet(1, 25, 20, true),
      buildSet(2, 25, 22, true),
    ]); // win 2-0
    const m2 = buildMatch('m2', 'A', [
      buildSet(1, 20, 25, true),
      buildSet(2, 22, 25, true),
    ]); // loss 0-2
    const o = teamOverview([m1, m2]);
    expect(o.wins).toBe(1);
    expect(o.losses).toBe(1);
    expect(o.winRate).toBe(50);
    expect(o.setsWon).toBe(2);
    expect(o.setsLost).toBe(2);
    expect(o.pointsScored).toBe(92);
    expect(o.pointsConceded).toBe(92);
  });

  it('ignora partidas nao finalizadas no calculo de winRate', () => {
    const m1 = buildMatch(
      'm1',
      'A',
      [buildSet(1, 25, 20, true), buildSet(2, 25, 22, true)],
      'finished',
    );
    const m2 = buildMatch('m2', 'A', [buildSet(1, 10, 8, false)], 'in_progress');
    const o = teamOverview([m1, m2]);
    expect(o.totalMatches).toBe(2);
    expect(o.finished).toBe(1);
    expect(o.winRate).toBe(100);
  });

  it('recentForm pega ate 5 ultimas finalizadas em ordem desc por data', () => {
    const matches = [
      buildMatch('m1', 'A', [buildSet(1, 25, 20, true), buildSet(2, 25, 22, true)], 'finished', [], '2026-01-01'),
      buildMatch('m2', 'A', [buildSet(1, 20, 25, true), buildSet(2, 22, 25, true)], 'finished', [], '2026-02-01'),
      buildMatch('m3', 'A', [buildSet(1, 25, 20, true), buildSet(2, 25, 22, true)], 'finished', [], '2026-03-01'),
    ];
    const o = teamOverview(matches);
    // Mais recente primeiro: m3=W, m2=L, m1=W
    expect(o.recentForm).toEqual(['W', 'L', 'W']);
  });
});

describe('aggregatePlayerStats', () => {
  it('soma stats do mesmo jogador atraves de varias partidas', () => {
    const p = buildPlayer(1, 'Lucas', 'Oposto');

    const setA = buildSet(1, 25, 20, true, {
      1: applyAction(emptyPlayerStats(), 'attack_point'),
    });
    const setB = buildSet(1, 25, 22, true, {
      1: applyAction(applyAction(emptyPlayerStats(), 'attack_point'), 'attack_point'),
    });
    const m1 = buildMatch('m1', 'A', [setA], 'finished', [p]);
    const m2 = buildMatch('m2', 'A', [setB], 'finished', [p]);

    const aggs = aggregatePlayerStats([m1, m2], [p]);
    expect(aggs).toHaveLength(1);
    expect(aggs[0].stats.attacks.success).toBe(3); // 1 + 2
    expect(aggs[0].matchesPlayed).toBe(2);
  });

  it('ignora partidas nao finalizadas', () => {
    const p = buildPlayer(1, 'Lucas');
    const set = buildSet(1, 25, 20, true, {
      1: applyAction(emptyPlayerStats(), 'attack_point'),
    });
    const m1 = buildMatch('m1', 'A', [set], 'finished', [p]);
    const m2 = buildMatch('m2', 'A', [set], 'in_progress', [p]);
    const aggs = aggregatePlayerStats([m1, m2], [p]);
    expect(aggs[0].matchesPlayed).toBe(1);
    expect(aggs[0].stats.attacks.success).toBe(1);
  });

  it('jogador sem acoes registradas tem matchesPlayed=0', () => {
    const p1 = buildPlayer(1, 'Ativo');
    const p2 = buildPlayer(2, 'Banco');
    const set = buildSet(1, 25, 20, true, {
      1: applyAction(emptyPlayerStats(), 'attack_point'),
      // p2 nao tem stats
    });
    const m = buildMatch('m1', 'A', [set], 'finished', [p1, p2]);
    const aggs = aggregatePlayerStats([m], [p1, p2]);
    const p2Agg = aggs.find((a) => a.player.number === 2);
    expect(p2Agg?.matchesPlayed).toBe(0);
    expect(p2Agg?.directPoints).toBe(0);
  });

  it('retorna ordem alfabetica por nome do jogador', () => {
    const players = [
      buildPlayer(1, 'Carlos'),
      buildPlayer(2, 'Ana'),
      buildPlayer(3, 'Bruno'),
    ];
    const aggs = aggregatePlayerStats([], players);
    expect(aggs.map((a) => a.player.name)).toEqual(['Ana', 'Bruno', 'Carlos']);
  });
});

describe('topPerformers', () => {
  it('todos null quando nao tem jogadores com matchesPlayed > 0', () => {
    const p = buildPlayer(1, 'A');
    const aggs = aggregatePlayerStats([], [p]);
    expect(topPerformers(aggs)).toEqual({
      scorer: null,
      server: null,
      blocker: null,
      passer: null,
    });
  });

  it('elege scorer pelo maior directPoints', () => {
    const p1 = buildPlayer(1, 'A');
    const p2 = buildPlayer(2, 'B');
    // p1 = 2 ataques sucesso, p2 = 5 ataques sucesso -> p2 ganha
    const set = buildSet(1, 25, 20, true, {
      1: applyAction(applyAction(emptyPlayerStats(), 'attack_point'), 'attack_point'),
      2: ['attack_point', 'attack_point', 'attack_point', 'attack_point', 'attack_point'].reduce(
        (acc, a) => applyAction(acc, a as 'attack_point'),
        emptyPlayerStats(),
      ),
    });
    const m = buildMatch('m1', 'A', [set], 'finished', [p1, p2]);
    const aggs = aggregatePlayerStats([m], [p1, p2]);
    const tops = topPerformers(aggs);
    expect(tops.scorer?.player.number).toBe(2);
    expect(tops.scorer?.directPoints).toBe(5);
  });

  it('passer requer minimo 20 passes pra entrar no ranking', () => {
    const p1 = buildPlayer(1, 'PoucoPasse');
    // 5 passes A — bom mas volume baixo, nao deve ser eleito
    const stats1 = ['pass_a', 'pass_a', 'pass_a', 'pass_a', 'pass_a'].reduce(
      (acc, a) => applyAction(acc, a as 'pass_a'),
      emptyPlayerStats(),
    );
    const set = buildSet(1, 25, 20, true, {
      1: { ...stats1, passes: { ...stats1.passes } },
    });
    const m = buildMatch('m1', 'A', [set], 'finished', [p1]);
    const aggs = aggregatePlayerStats([m], [p1]);
    expect(topPerformers(aggs).passer).toBeNull();
  });
});

describe('teamEfficiencies', () => {
  it('zera quando nao tem stats', () => {
    const eff = teamEfficiencies([]);
    expect(eff.attackPct).toBe(0);
    expect(eff.servePct).toBe(0);
    expect(eff.passPct).toBe(0);
    expect(eff.blockPct).toBe(0);
    expect(eff.totalAttacks).toBe(0);
  });

  it('soma ataques e calcula % global', () => {
    const p = buildPlayer(1, 'A');
    // 3 attack_point (success) + 2 attack_error -> 60% attack
    const stats = ['attack_point', 'attack_point', 'attack_point', 'attack_error', 'attack_error'].reduce(
      (acc, a) => applyAction(acc, a as 'attack_point' | 'attack_error'),
      emptyPlayerStats(),
    );
    const set = buildSet(1, 25, 20, true, { 1: stats });
    const m = buildMatch('m1', 'A', [set], 'finished', [p]);
    const aggs = aggregatePlayerStats([m], [p]);
    const eff = teamEfficiencies(aggs);
    expect(eff.totalAttacks).toBe(5);
    expect(eff.attackPct).toBe(60);
  });
});
