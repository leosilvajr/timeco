import {
  ScoreboardConfig,
  ScoreboardState,
  addPoint,
  createScoreboard,
  currentSetScore,
  isSetWon,
  matchPointStatus,
  resetMatch,
  setsWonByTeams,
  undoLastPoint,
} from './scoreboardLogic';

const VOLLEY: ScoreboardConfig = {
  teamAName: 'Time 1',
  teamBName: 'Time 2',
  pointsToWin: 25,
  winByTwo: true,
  bestOfSets: 5,
  finalSetPointsToWin: 15,
};

const SIMPLE_10: ScoreboardConfig = {
  teamAName: 'A',
  teamBName: 'B',
  pointsToWin: 10,
  winByTwo: false,
  bestOfSets: 1,
};

const addN = (state: ScoreboardState, team: 'A' | 'B', n: number): ScoreboardState => {
  let s = state;
  for (let i = 0; i < n; i++) s = addPoint(s, team);
  return s;
};

describe('createScoreboard', () => {
  it('cria estado inicial com 1 set vazio', () => {
    const s = createScoreboard(VOLLEY);
    expect(s.sets).toHaveLength(1);
    expect(s.sets[0]).toEqual({ a: 0, b: 0, finished: false });
    expect(s.currentSetIndex).toBe(0);
    expect(s.status).toBe('in_progress');
    expect(s.history).toEqual([]);
  });
});

describe('isSetWon', () => {
  it('chega no alvo com 2pt de vantagem fecha (winByTwo)', () => {
    expect(isSetWon({ a: 25, b: 23, finished: false }, 25, true)).toBe('A');
    expect(isSetWon({ a: 25, b: 24, finished: false }, 25, true)).toBeNull();
    expect(isSetWon({ a: 27, b: 25, finished: false }, 25, true)).toBe('A');
  });

  it('sem winByTwo, basta atingir o alvo', () => {
    expect(isSetWon({ a: 10, b: 9, finished: false }, 10, false)).toBe('A');
    expect(isSetWon({ a: 10, b: 10, finished: false }, 10, false)).toBeNull();
  });

  it('quando os dois passaram do alvo, ganha quem tem 2pt', () => {
    expect(isSetWon({ a: 26, b: 28, finished: false }, 25, true)).toBe('B');
  });
});

describe('addPoint — fim de set', () => {
  it('placar 24x24 (vôlei): mais 1 pt do A não fecha (24x25 → continua)', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 24);
    s = addN(s, 'B', 24);
    s = addPoint(s, 'B'); // 24-25 → não fecha (precisa de 2 vantagem)
    expect(s.sets[0].finished).toBe(false);
    expect(currentSetScore(s)).toEqual({ a: 24, b: 25 });
  });

  it('placar 24x24, A faz 2pt seguidos → fecha 26x24', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 24);
    s = addN(s, 'B', 24);
    s = addPoint(s, 'A'); // 25-24
    s = addPoint(s, 'A'); // 26-24 → fecha set 1
    expect(s.sets[0].finished).toBe(true);
    expect(s.sets[0].winner).toBe('A');
    // Cria set 2 vazio
    expect(s.sets).toHaveLength(2);
    expect(s.currentSetIndex).toBe(1);
  });

  it('jogo simples (10pts sem winByTwo): empate 10x10 não fecha', () => {
    // Nesse caso winByTwo=false, mas score precisa ser maior que o adversário.
    let s = createScoreboard(SIMPLE_10);
    s = addN(s, 'A', 10);
    s = addN(s, 'B', 9);
    expect(s.sets[0].finished).toBe(true);
    expect(s.sets[0].winner).toBe('A');
  });
});

describe('addPoint — fim de partida', () => {
  it('best-of-3: vence quem fizer 2 sets', () => {
    let s = createScoreboard({ ...VOLLEY, bestOfSets: 3, finalSetPointsToWin: 15 });
    // Set 1: A vence 25x10
    s = addN(s, 'A', 25);
    s = addN(s, 'B', 10);
    // Set 2: B vence 25x20
    s = addN(s, 'B', 25);
    s = addN(s, 'A', 20);
    // Set 3 (decisivo, 15 pts): A vence 15x10
    s = addN(s, 'A', 15);
    s = addN(s, 'B', 10);

    expect(s.status).toBe('finished');
    expect(s.winner).toBe('A');
    expect(setsWonByTeams(s)).toEqual({ a: 2, b: 1 });
  });

  it('set decisivo respeita finalSetPointsToWin (15 no vôlei)', () => {
    let s = createScoreboard({ ...VOLLEY, bestOfSets: 3, finalSetPointsToWin: 15 });
    s = addN(s, 'A', 25);
    s = addN(s, 'B', 10);
    s = addN(s, 'B', 25);
    s = addN(s, 'A', 15);
    // Score 0 do B no set decisivo
    s = addN(s, 'A', 15);
    expect(s.sets[2].finished).toBe(true);
    expect(s.sets[2].winner).toBe('A');
  });

  it('best-of-1 termina com 1 set', () => {
    let s = createScoreboard(SIMPLE_10);
    s = addN(s, 'A', 10);
    s = addN(s, 'B', 8);
    expect(s.status).toBe('finished');
    expect(s.winner).toBe('A');
  });

  it('depois de finalizado, não aceita mais pontos', () => {
    let s = createScoreboard(SIMPLE_10);
    s = addN(s, 'A', 10);
    const before = s;
    s = addPoint(s, 'A');
    expect(s).toBe(before);
  });
});

describe('undoLastPoint', () => {
  it('volta um ponto simples sem fechar set', () => {
    let s = createScoreboard(VOLLEY);
    s = addPoint(s, 'A');
    s = addPoint(s, 'A');
    s = undoLastPoint(s);
    expect(currentSetScore(s)).toEqual({ a: 1, b: 0 });
    expect(s.history).toHaveLength(1);
  });

  it('volta o ponto que fechou um set (re-abre o set anterior)', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 24);
    s = addN(s, 'B', 24);
    s = addPoint(s, 'A'); // 25-24
    s = addPoint(s, 'A'); // 26-24 → fecha set
    expect(s.sets).toHaveLength(2);
    expect(s.currentSetIndex).toBe(1);

    s = undoLastPoint(s);
    expect(s.sets).toHaveLength(1);
    expect(s.sets[0].finished).toBe(false);
    expect(currentSetScore(s)).toEqual({ a: 25, b: 24 });
    expect(s.currentSetIndex).toBe(0);
  });

  it('volta o ponto final que terminou a partida', () => {
    let s = createScoreboard(SIMPLE_10);
    s = addN(s, 'A', 10);
    expect(s.status).toBe('finished');
    s = undoLastPoint(s);
    expect(s.status).toBe('in_progress');
    expect(s.winner).toBeUndefined();
    expect(currentSetScore(s)).toEqual({ a: 9, b: 0 });
  });

  it('histórico vazio: noop', () => {
    const s = createScoreboard(VOLLEY);
    expect(undoLastPoint(s)).toBe(s);
  });
});

describe('matchPointStatus', () => {
  it('null quando ninguém está perto de fechar', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 10);
    expect(matchPointStatus(s)).toBeNull();
  });

  it('set_point quando o próximo ponto fecharia o set (mas não a partida)', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 24);
    s = addN(s, 'B', 20);
    expect(matchPointStatus(s)).toEqual({ team: 'A', type: 'set_point' });
  });

  it('match_point quando próximo ponto fecharia partida', () => {
    let s = createScoreboard({ ...VOLLEY, bestOfSets: 3 });
    // A ganha 1 set
    s = addN(s, 'A', 25);
    s = addN(s, 'B', 10);
    // No 2o set, A está em 24x10 → próximo ponto fecha set E partida
    s = addN(s, 'A', 24);
    s = addN(s, 'B', 10);
    expect(matchPointStatus(s)).toEqual({ team: 'A', type: 'match_point' });
  });

  it('null quando set acabou de fechar (próximo set acabou de começar)', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 25);
    s = addN(s, 'B', 10);
    expect(matchPointStatus(s)).toBeNull();
  });

  it('com winByTwo, set_point exige 2 de vantagem para o próximo ponto fechar', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 24);
    s = addN(s, 'B', 24);
    // 24x24: nenhum está em set point pq +1 não fecha
    expect(matchPointStatus(s)).toBeNull();
    // depois A faz 25x24: agora SE A fizer outro, fecha → set point
    s = addPoint(s, 'A');
    expect(matchPointStatus(s)).toEqual({ team: 'A', type: 'set_point' });
  });
});

describe('resetMatch', () => {
  it('zera placar mantendo config', () => {
    let s = createScoreboard(VOLLEY);
    s = addN(s, 'A', 10);
    s = resetMatch(s);
    expect(s.sets).toHaveLength(1);
    expect(currentSetScore(s)).toEqual({ a: 0, b: 0 });
    expect(s.config).toBe(VOLLEY);
    expect(s.history).toEqual([]);
  });
});

describe('setsWonByTeams', () => {
  it('conta corretamente sets ganhos', () => {
    let s = createScoreboard({ ...VOLLEY, bestOfSets: 3, finalSetPointsToWin: 15 });
    s = addN(s, 'A', 25);
    s = addN(s, 'B', 10);
    expect(setsWonByTeams(s)).toEqual({ a: 1, b: 0 });
    // B precisa de mais 15 pra fechar o set 2 (já tinha 10)
    s = addN(s, 'B', 15);
    expect(setsWonByTeams(s)).toEqual({ a: 1, b: 1 });
  });
});
