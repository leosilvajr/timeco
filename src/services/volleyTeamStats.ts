/**
 * Agregacao de estatisticas de UM time atraves de multiplas partidas.
 *
 * Convencao: trata como "nosso time" o lado A da partida (teamAName).
 * O VolleyHome ja garante que toda partida criada pelo usuario tem o
 * proprio time como A.
 */

import {
  PlayerVolleyStats,
  VolleyMatch,
  VolleyPlayer,
  VolleySetData,
} from '../types';
import {
  accumulateAcrossSets,
  attackPercentage,
  blockPercentage,
  directPoints,
  emptyPlayerStats,
  overallEfficiency,
  passPercentage,
  servePercentage,
  sumPlayerStats,
  totalActions,
  totalAttacks,
  totalBlocks,
  totalErrors,
  totalPasses,
  totalServes,
} from './volleyStats';

export interface TeamMatchOutcome {
  match: VolleyMatch;
  setsA: number;
  setsB: number;
  pointsA: number;
  pointsB: number;
  won: boolean | null; // null se nao finalizado
}

export interface TeamOverview {
  totalMatches: number;
  finished: number;
  wins: number;
  losses: number;
  winRate: number; // 0..100
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
  /** Ultimas 5 partidas (mais recente primeiro): 'W' | 'L' */
  recentForm: ('W' | 'L')[];
}

export interface PlayerAggregate {
  player: VolleyPlayer;
  stats: PlayerVolleyStats;
  matchesPlayed: number;
  directPoints: number;
  attackPct: number;
  servePct: number;
  blockPct: number;
  passPct: number;
  efficiency: number;
}

/** Computa resultado de uma partida pro lado A (nosso time). */
export const matchOutcome = (match: VolleyMatch): TeamMatchOutcome => {
  let setsA = 0;
  let setsB = 0;
  let pointsA = 0;
  let pointsB = 0;
  for (const s of match.sets) {
    pointsA += s.scoreA;
    pointsB += s.scoreB;
    if (!s.finished) continue;
    if (s.scoreA > s.scoreB) setsA += 1;
    else if (s.scoreB > s.scoreA) setsB += 1;
  }
  const won =
    match.status === 'finished'
      ? setsA > setsB
      : null;
  return { match, setsA, setsB, pointsA, pointsB, won };
};

/** Filtra partidas onde `teamAName` bate com o nome do time. */
export const matchesForTeam = (
  allMatches: VolleyMatch[],
  teamName: string,
): VolleyMatch[] => {
  const target = teamName.trim().toLowerCase();
  return allMatches.filter(
    (m) => m.teamAName.trim().toLowerCase() === target,
  );
};

export const teamOverview = (matches: VolleyMatch[]): TeamOverview => {
  const finishedMatches = matches.filter((m) => m.status === 'finished');
  let wins = 0;
  let losses = 0;
  let setsWon = 0;
  let setsLost = 0;
  let pointsScored = 0;
  let pointsConceded = 0;

  const outcomes = finishedMatches.map(matchOutcome);
  for (const o of outcomes) {
    if (o.won) wins += 1;
    else losses += 1;
    setsWon += o.setsA;
    setsLost += o.setsB;
    pointsScored += o.pointsA;
    pointsConceded += o.pointsB;
  }

  // Ordenar por data desc pra pegar as ultimas 5
  const recent = [...outcomes].sort((a, b) =>
    b.match.date.localeCompare(a.match.date),
  );
  const recentForm: ('W' | 'L')[] = recent
    .slice(0, 5)
    .map((o) => (o.won ? 'W' : 'L'));

  return {
    totalMatches: matches.length,
    finished: finishedMatches.length,
    wins,
    losses,
    winRate: finishedMatches.length > 0 ? (wins / finishedMatches.length) * 100 : 0,
    setsWon,
    setsLost,
    pointsScored,
    pointsConceded,
    recentForm,
  };
};

/**
 * Agrega stats de cada jogador atraves de todas as partidas finalizadas.
 * Soma jogadores pelo NUMERO da camisa (assume que numeros sao estaveis
 * dentro do time). Retorna array ordenado por nome.
 */
export const aggregatePlayerStats = (
  matches: VolleyMatch[],
  teamPlayers: VolleyPlayer[],
): PlayerAggregate[] => {
  const accStats: Record<number, PlayerVolleyStats> = {};
  const accMatches: Record<number, Set<string>> = {};

  for (const m of matches) {
    if (m.status !== 'finished') continue;
    for (const p of m.players) {
      const acrossSets = accumulateAcrossSets(m.sets, p.number);
      // Considera "jogou" se tiver ao menos 1 acao registrada
      if (totalActions(acrossSets) === 0) continue;
      accStats[p.number] = accStats[p.number]
        ? sumPlayerStats(accStats[p.number], acrossSets)
        : acrossSets;
      if (!accMatches[p.number]) accMatches[p.number] = new Set();
      accMatches[p.number].add(m.id);
    }
  }

  return teamPlayers
    .map((p) => {
      const stats = accStats[p.number] ?? emptyPlayerStats();
      return {
        player: p,
        stats,
        matchesPlayed: accMatches[p.number]?.size ?? 0,
        directPoints: directPoints(stats),
        attackPct: attackPercentage(stats),
        servePct: servePercentage(stats),
        blockPct: blockPercentage(stats),
        passPct: passPercentage(stats),
        efficiency: overallEfficiency(stats),
      };
    })
    .sort((a, b) => a.player.name.localeCompare(b.player.name));
};

export interface TopPerformers {
  /** Maior somatorio de pontos diretos (ataque + ace + bloqueio sucesso). */
  scorer: PlayerAggregate | null;
  /** Maior numero de aces. */
  server: PlayerAggregate | null;
  /** Maior numero de blocks sucesso. */
  blocker: PlayerAggregate | null;
  /** Melhor % passe (A+B / total) — minimo de 20 passes pra entrar. */
  passer: PlayerAggregate | null;
}

export const topPerformers = (aggs: PlayerAggregate[]): TopPerformers => {
  const valid = aggs.filter((a) => a.matchesPlayed > 0);
  if (valid.length === 0) {
    return { scorer: null, server: null, blocker: null, passer: null };
  }

  const scorer = [...valid].sort((a, b) => b.directPoints - a.directPoints)[0];
  const server = [...valid].sort(
    (a, b) => b.stats.serves.ace - a.stats.serves.ace,
  )[0];
  const blocker = [...valid].sort(
    (a, b) => b.stats.blocks.success - a.stats.blocks.success,
  )[0];

  const passersWithVolume = valid.filter((a) => totalPasses(a.stats) >= 20);
  const passer =
    passersWithVolume.length > 0
      ? [...passersWithVolume].sort((a, b) => b.passPct - a.passPct)[0]
      : null;

  return { scorer, server, blocker, passer };
};

export interface TeamEfficiencies {
  attackPct: number;
  servePct: number;
  passPct: number;
  blockPct: number;
  totalAttacks: number;
  totalServes: number;
  totalPasses: number;
  totalBlocks: number;
  totalErrors: number;
}

export const teamEfficiencies = (aggs: PlayerAggregate[]): TeamEfficiencies => {
  const combined = aggs.reduce<PlayerVolleyStats>(
    (acc, a) => sumPlayerStats(acc, a.stats),
    emptyPlayerStats(),
  );
  return {
    attackPct: attackPercentage(combined),
    servePct: servePercentage(combined),
    passPct: passPercentage(combined),
    blockPct: blockPercentage(combined),
    totalAttacks: totalAttacks(combined),
    totalServes: totalServes(combined),
    totalPasses: totalPasses(combined),
    totalBlocks: totalBlocks(combined),
    totalErrors: totalErrors(combined),
  };
};
