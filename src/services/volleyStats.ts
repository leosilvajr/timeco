import { PlayerVolleyStats, VolleyAction, VolleySetData } from '../types';

/** Cria uma estrutura de stats zerada — usada ao adicionar um jogador novo. */
export const emptyPlayerStats = (): PlayerVolleyStats => ({
  attacks: { success: 0, error: 0, normal: 0 },
  serves: { success: 0, error: 0, ace: 0 },
  blocks: { success: 0, error: 0, normal: 0 },
  passes: { a: 0, b: 0, c: 0, error: 0 },
  sets: {
    success: 0,
    error: 0,
    ponta: 0,
    saida: 0,
    meio: 0,
    fundo_meio: 0,
    fundo_saida: 0,
    dump_point: 0,
    dump_normal: 0,
    dump_error: 0,
  },
});

/**
 * Aplica uma ação à estrutura de stats. Retorna NOVA estrutura (imutável).
 * `delta` pode ser +1 (registrar) ou -1 (corrigir/desfazer).
 * Nunca produz valores negativos — Math.max(0, ...).
 */
export const applyAction = (
  stats: PlayerVolleyStats,
  action: VolleyAction,
  delta: 1 | -1 = 1,
): PlayerVolleyStats => {
  const next: PlayerVolleyStats = {
    attacks: { ...stats.attacks },
    serves: { ...stats.serves },
    blocks: { ...stats.blocks },
    passes: { ...stats.passes },
    sets: { ...stats.sets },
  };
  const inc = (group: Record<string, number>, key: string) => {
    group[key] = Math.max(0, (group[key] ?? 0) + delta);
  };
  switch (action) {
    case 'serve_success': inc(next.serves, 'success'); break;
    case 'serve_error':   inc(next.serves, 'error');   break;
    case 'ace':           inc(next.serves, 'ace');     break;
    case 'attack_point':  inc(next.attacks, 'success'); break;
    case 'attack':        inc(next.attacks, 'normal'); break;
    case 'attack_error':  inc(next.attacks, 'error');  break;
    case 'block_success': inc(next.blocks, 'success'); break;
    case 'block_normal':  inc(next.blocks, 'normal');  break;
    case 'block_error':   inc(next.blocks, 'error');   break;
    case 'pass_a':        inc(next.passes, 'a');       break;
    case 'pass_b':        inc(next.passes, 'b');       break;
    case 'pass_c':        inc(next.passes, 'c');       break;
    case 'pass_error':    inc(next.passes, 'error');   break;
    case 'set_success':   inc(next.sets, 'success');   break;
    case 'set_error':     inc(next.sets, 'error');     break;
    case 'set_ponta':     inc(next.sets, 'ponta');     break;
    case 'set_saida':     inc(next.sets, 'saida');     break;
    case 'set_meio':      inc(next.sets, 'meio');      break;
    case 'set_fundo_meio': inc(next.sets, 'fundo_meio'); break;
    case 'set_fundo_saida': inc(next.sets, 'fundo_saida'); break;
    case 'set_dump_point':   inc(next.sets, 'dump_point');   break;
    case 'set_dump':         inc(next.sets, 'dump_normal');  break;
    case 'set_dump_error':   inc(next.sets, 'dump_error');   break;
  }
  return next;
};

// ============ Cálculos por categoria ============

export const totalAttacks = (s: PlayerVolleyStats): number =>
  s.attacks.success + s.attacks.error + s.attacks.normal;

export const totalServes = (s: PlayerVolleyStats): number =>
  s.serves.success + s.serves.error + s.serves.ace;

export const totalPasses = (s: PlayerVolleyStats): number =>
  s.passes.a + s.passes.b + s.passes.c + s.passes.error;

export const totalBlocks = (s: PlayerVolleyStats): number =>
  s.blocks.success + s.blocks.error + s.blocks.normal;

export const totalSetActions = (s: PlayerVolleyStats): number =>
  s.sets.success + s.sets.error;

/** Percentual de eficiência de ataque: ataques pontuados / total. */
export const attackPercentage = (s: PlayerVolleyStats): number => {
  const t = totalAttacks(s);
  return t > 0 ? (s.attacks.success / t) * 100 : 0;
};

/** Saques bons (acertos + aces) / total. */
export const servePercentage = (s: PlayerVolleyStats): number => {
  const t = totalServes(s);
  return t > 0 ? ((s.serves.success + s.serves.ace) / t) * 100 : 0;
};

/** Passes bons (A + B) / total. */
export const passPercentage = (s: PlayerVolleyStats): number => {
  const t = totalPasses(s);
  return t > 0 ? ((s.passes.a + s.passes.b) / t) * 100 : 0;
};

/** Bloqueios sucesso / total. */
export const blockPercentage = (s: PlayerVolleyStats): number => {
  const t = totalBlocks(s);
  return t > 0 ? (s.blocks.success / t) * 100 : 0;
};

/** Levantamentos certos / (certos + errados). */
export const setPercentage = (s: PlayerVolleyStats): number => {
  const t = totalSetActions(s);
  return t > 0 ? (s.sets.success / t) * 100 : 0;
};

/** Pontos diretos = ataques que viram ponto + aces + bolas de 2a. */
export const directPoints = (s: PlayerVolleyStats): number =>
  s.attacks.success + s.serves.ace + s.sets.dump_point;

/** Total de erros do jogador (todas as categorias). */
export const totalErrors = (s: PlayerVolleyStats): number =>
  s.attacks.error + s.serves.error + s.blocks.error + s.passes.error + s.sets.error;

/** Total de ações registradas (todas as categorias somadas). */
export const totalActions = (s: PlayerVolleyStats): number =>
  totalAttacks(s) +
  totalServes(s) +
  totalPasses(s) +
  totalBlocks(s) +
  totalSetActions(s);

/** Eficiência geral = pontos diretos / ações totais. */
export const overallEfficiency = (s: PlayerVolleyStats): number => {
  const t = totalActions(s);
  return t > 0 ? (directPoints(s) / t) * 100 : 0;
};

// ============ Agregação multi-jogador / multi-set ============

export const sumPlayerStats = (
  a: PlayerVolleyStats,
  b: PlayerVolleyStats,
): PlayerVolleyStats => ({
  attacks: {
    success: a.attacks.success + b.attacks.success,
    error: a.attacks.error + b.attacks.error,
    normal: a.attacks.normal + b.attacks.normal,
  },
  serves: {
    success: a.serves.success + b.serves.success,
    error: a.serves.error + b.serves.error,
    ace: a.serves.ace + b.serves.ace,
  },
  blocks: {
    success: a.blocks.success + b.blocks.success,
    error: a.blocks.error + b.blocks.error,
    normal: a.blocks.normal + b.blocks.normal,
  },
  passes: {
    a: a.passes.a + b.passes.a,
    b: a.passes.b + b.passes.b,
    c: a.passes.c + b.passes.c,
    error: a.passes.error + b.passes.error,
  },
  sets: {
    success: a.sets.success + b.sets.success,
    error: a.sets.error + b.sets.error,
    ponta: a.sets.ponta + b.sets.ponta,
    saida: a.sets.saida + b.sets.saida,
    meio: a.sets.meio + b.sets.meio,
    fundo_meio: a.sets.fundo_meio + b.sets.fundo_meio,
    fundo_saida: a.sets.fundo_saida + b.sets.fundo_saida,
    dump_point: a.sets.dump_point + b.sets.dump_point,
    dump_normal: a.sets.dump_normal + b.sets.dump_normal,
    dump_error: a.sets.dump_error + b.sets.dump_error,
  },
});

/** Soma stats do mesmo jogador através de todos os sets fornecidos. */
export const accumulateAcrossSets = (
  sets: VolleySetData[],
  playerNumber: number,
): PlayerVolleyStats => {
  return sets.reduce<PlayerVolleyStats>((acc, set) => {
    const ps = set.playerStats[playerNumber];
    return ps ? sumPlayerStats(acc, ps) : acc;
  }, emptyPlayerStats());
};

// ============ Resumo de equipe ============

export interface TeamSummary {
  // Resumo basico (compat)
  totalPoints: number;
  totalAces: number;
  totalBlocks: number;
  totalErrors: number;
  // Detalhamento por categoria (acumulados)
  totalAttacks: number;
  totalAttackPoints: number;
  totalAttackErrors: number;
  totalServes: number;
  totalServeErrors: number;
  totalPasses: number;
  totalPassesGood: number;  // A + B
  totalPassErrors: number;
  totalBlocksTotal: number;
  totalBlockErrors: number;
  totalDumps: number;
  totalDumpPoints: number;
  totalDumpErrors: number;
  // Percentuais agregados do time inteiro
  attackPct: number;     // success / total
  servePct: number;      // (success + ace) / total
  passPct: number;       // (A + B) / total
  blockPct: number;      // success / total
}

/** Resumo COMPLETO de uma equipe a partir do mapa playerNumber → stats. */
export const teamSummary = (
  playerStats: Record<number, PlayerVolleyStats>,
): TeamSummary => {
  let totalPoints = 0;
  let totalAces = 0;
  let totalBlocks = 0;
  let totalErrors = 0;
  let totalAttacks = 0;
  let totalAttackPoints = 0;
  let totalAttackErrors = 0;
  let totalServes = 0;
  let totalServeErrors = 0;
  let totalPasses = 0;
  let totalPassesGood = 0;
  let totalPassErrors = 0;
  let totalBlocksTotal = 0;
  let totalBlockErrors = 0;
  let totalDumps = 0;
  let totalDumpPoints = 0;
  let totalDumpErrors = 0;

  let serveSuccessPlusAce = 0;

  for (const s of Object.values(playerStats)) {
    totalPoints += s.attacks.success + s.serves.ace + s.blocks.success + s.sets.dump_point;
    totalAces += s.serves.ace;
    totalBlocks += s.blocks.success;
    totalErrors += s.attacks.error + s.serves.error + s.blocks.error + s.passes.error + s.sets.error + s.sets.dump_error;

    totalAttacks += s.attacks.success + s.attacks.normal + s.attacks.error;
    totalAttackPoints += s.attacks.success;
    totalAttackErrors += s.attacks.error;

    totalServes += s.serves.success + s.serves.error + s.serves.ace;
    totalServeErrors += s.serves.error;
    serveSuccessPlusAce += s.serves.success + s.serves.ace;

    totalPasses += s.passes.a + s.passes.b + s.passes.c + s.passes.error;
    totalPassesGood += s.passes.a + s.passes.b;
    totalPassErrors += s.passes.error;

    totalBlocksTotal += s.blocks.success + s.blocks.normal + s.blocks.error;
    totalBlockErrors += s.blocks.error;

    totalDumps += s.sets.dump_point + s.sets.dump_normal + s.sets.dump_error;
    totalDumpPoints += s.sets.dump_point;
    totalDumpErrors += s.sets.dump_error;
  }

  const attackPct = totalAttacks > 0 ? (totalAttackPoints / totalAttacks) * 100 : 0;
  const servePct = totalServes > 0 ? (serveSuccessPlusAce / totalServes) * 100 : 0;
  const passPct = totalPasses > 0 ? (totalPassesGood / totalPasses) * 100 : 0;
  const blockPct = totalBlocksTotal > 0 ? (totalBlocks / totalBlocksTotal) * 100 : 0;

  return {
    totalPoints,
    totalAces,
    totalBlocks,
    totalErrors,
    totalAttacks,
    totalAttackPoints,
    totalAttackErrors,
    totalServes,
    totalServeErrors,
    totalPasses,
    totalPassesGood,
    totalPassErrors,
    totalBlocksTotal,
    totalBlockErrors,
    totalDumps,
    totalDumpPoints,
    totalDumpErrors,
    attackPct,
    servePct,
    passPct,
    blockPct,
  };
};

/** Limites de bom/ruim para colorir percentuais (mesmas regras do scout do Lucas). */
export const efficiencyThresholds = {
  attack: 50,
  serve: 70,
  pass: 70,
  block: 60,
  set: 80,
  overall: 30,
};
