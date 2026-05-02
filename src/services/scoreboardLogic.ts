/**
 * Lógica pura de placar eletrônico.
 * Suporta:
 * - Pontuação alvo configurável (ex: 25 vôlei, 11 tênis de mesa)
 * - Regra "win by 2" (diferença mínima de 2 pontos)
 * - Sistema de sets com best-of-N (1, 3, 5)
 * - Set decisivo com pontuação diferente (ex: vôlei = 15 no 5° set)
 * - Histórico pra undo
 */

export type Team = 'A' | 'B';

export interface ScoreboardConfig {
  teamAName: string;
  teamBName: string;
  /** Pontuação alvo nos sets normais. */
  pointsToWin: number;
  /** Se true, exige 2 pontos de vantagem pra vencer (regra clássica do vôlei). */
  winByTwo: boolean;
  /** Quantos sets ganhar pra encerrar a partida. ex: 3 = melhor-de-3, 1 = sem sets. */
  bestOfSets: number;
  /** Pontuação alvo no set decisivo (último). Default = pointsToWin. */
  finalSetPointsToWin?: number;
}

export interface SetScore {
  a: number;
  b: number;
  finished: boolean;
  winner?: Team;
}

export interface PointEvent {
  team: Team;
  setIndex: number;
}

export interface ScoreboardState {
  config: ScoreboardConfig;
  sets: SetScore[];
  /** Índice do set em jogo. */
  currentSetIndex: number;
  status: 'in_progress' | 'finished';
  winner?: Team;
  history: PointEvent[];
}

const setsToWinMatch = (bestOf: number): number => Math.ceil(bestOf / 2);

const targetForSet = (config: ScoreboardConfig, setIndex: number, totalSets: number): number => {
  const isFinalSet = setIndex === totalSets - 1 && totalSets === config.bestOfSets;
  if (isFinalSet && config.finalSetPointsToWin) return config.finalSetPointsToWin;
  return config.pointsToWin;
};

/** Verifica se um set já tem condições de fim. */
export const isSetWon = (
  set: SetScore,
  target: number,
  winByTwo: boolean,
): Team | null => {
  const { a, b } = set;
  const lead = (x: number, y: number) => (winByTwo ? x - y >= 2 : x > y);
  if (a >= target && lead(a, b)) return 'A';
  if (b >= target && lead(b, a)) return 'B';
  return null;
};

/** Cria um novo placar com o config dado. */
export const createScoreboard = (config: ScoreboardConfig): ScoreboardState => ({
  config,
  sets: [{ a: 0, b: 0, finished: false }],
  currentSetIndex: 0,
  status: 'in_progress',
  history: [],
});

const totalSetsWon = (state: ScoreboardState): { a: number; b: number } => {
  let a = 0;
  let b = 0;
  for (const s of state.sets) {
    if (s.winner === 'A') a += 1;
    else if (s.winner === 'B') b += 1;
  }
  return { a, b };
};

/** Aplica um ponto pra um time. Atualiza set e status do match se necessário. */
export const addPoint = (state: ScoreboardState, team: Team): ScoreboardState => {
  if (state.status === 'finished') return state;
  const sets = state.sets.map((s) => ({ ...s }));
  const cur = sets[state.currentSetIndex];
  if (cur.finished) return state;
  if (team === 'A') cur.a += 1;
  else cur.b += 1;

  const target = targetForSet(state.config, state.currentSetIndex, sets.length);
  const setWinner = isSetWon(cur, target, state.config.winByTwo);

  const history = [...state.history, { team, setIndex: state.currentSetIndex }];

  if (setWinner) {
    cur.finished = true;
    cur.winner = setWinner;

    // Verifica se ganhou a partida
    const wins = totalSetsWon({ ...state, sets });
    const needed = setsToWinMatch(state.config.bestOfSets);
    if (wins.a >= needed || wins.b >= needed) {
      return {
        ...state,
        sets,
        history,
        status: 'finished',
        winner: wins.a > wins.b ? 'A' : 'B',
      };
    }
    // Cria próximo set
    sets.push({ a: 0, b: 0, finished: false });
    return {
      ...state,
      sets,
      history,
      currentSetIndex: state.currentSetIndex + 1,
    };
  }

  return { ...state, sets, history };
};

/** Desfaz o último ponto. Se reabriu um set, "des-finaliza" o set anterior. */
export const undoLastPoint = (state: ScoreboardState): ScoreboardState => {
  if (state.history.length === 0) return state;
  const lastEvent = state.history[state.history.length - 1];
  const sets = state.sets.map((s) => ({ ...s }));

  // Se o último ponto fechou um set, há um set "novo" depois dele que precisa
  // ser removido. Identifica pelo setIndex do evento.
  if (lastEvent.setIndex < sets.length - 1) {
    // Remove o set vazio criado depois do fim do set anterior
    sets.pop();
  }
  const cur = sets[lastEvent.setIndex];
  cur.finished = false;
  cur.winner = undefined;
  if (lastEvent.team === 'A') cur.a -= 1;
  else cur.b -= 1;

  return {
    ...state,
    sets,
    currentSetIndex: lastEvent.setIndex,
    status: 'in_progress',
    winner: undefined,
    history: state.history.slice(0, -1),
  };
};

/** Reset do match mantendo a config. */
export const resetMatch = (state: ScoreboardState): ScoreboardState =>
  createScoreboard(state.config);

/**
 * Verifica se algum time está em set point ou match point.
 * Retorna o time + tipo se sim, null caso contrário.
 */
export const matchPointStatus = (
  state: ScoreboardState,
): { team: Team; type: 'set_point' | 'match_point' } | null => {
  if (state.status === 'finished') return null;
  const cur = state.sets[state.currentSetIndex];
  if (!cur || cur.finished) return null;
  const target = targetForSet(state.config, state.currentSetIndex, state.sets.length);
  const wins = totalSetsWon(state);
  const needed = setsToWinMatch(state.config.bestOfSets);

  const checkTeam = (myScore: number, opScore: number, team: Team) => {
    // Próximo ponto fecha o set?
    const wouldWin = isSetWon(
      team === 'A' ? { a: myScore + 1, b: opScore, finished: false } : { a: opScore, b: myScore + 1, finished: false },
      target,
      state.config.winByTwo,
    );
    if (wouldWin === team) {
      const setsWon = team === 'A' ? wins.a : wins.b;
      // Se ganhar este set, ganha a partida?
      if (setsWon + 1 >= needed) return { team, type: 'match_point' as const };
      return { team, type: 'set_point' as const };
    }
    return null;
  };

  return checkTeam(cur.a, cur.b, 'A') ?? checkTeam(cur.b, cur.a, 'B');
};

/** Helpers de exibição. */
export const currentSetScore = (state: ScoreboardState): { a: number; b: number } => {
  const cur = state.sets[state.currentSetIndex];
  return { a: cur?.a ?? 0, b: cur?.b ?? 0 };
};

export const setsWonByTeams = (state: ScoreboardState): { a: number; b: number } =>
  totalSetsWon(state);
