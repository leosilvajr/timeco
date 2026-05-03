/**
 * SMOKE TEST · Fluxo completo do Placar Eletrônico
 *
 * Caixa-branca: pinga estados internos do scoreboardLogic durante
 * uma partida realista (vôlei melhor de 3, set decisivo a 15).
 * Caixa-preta: confirma que o texto compartilhado bate com o estado.
 */
import {
  ScoreboardConfig,
  ScoreboardState,
  addPoint,
  createScoreboard,
  currentSetScore,
  matchPointStatus,
  setsWonByTeams,
  undoLastPoint,
  resetMatch,
} from '../services/scoreboardLogic';
import { formatScoreboardResult } from '../utils/scoreboardShareText';

const VOLLEY_AMATEUR: ScoreboardConfig = {
  teamAName: 'Time Verde',
  teamBName: 'Time Azul',
  pointsToWin: 25,
  winByTwo: true,
  bestOfSets: 3,
  finalSetPointsToWin: 15,
  modalityLabel: 'Vôlei amador',
};

const TRUCO: ScoreboardConfig = {
  teamAName: 'Nós',
  teamBName: 'Eles',
  pointsToWin: 12,
  winByTwo: false,
  bestOfSets: 1,
  modalityLabel: 'Truco',
};

/** Aplica uma sequência de pontos descrita como string ("AABA..."). */
const playSequence = (state: ScoreboardState, seq: string): ScoreboardState => {
  let s = state;
  for (const ch of seq) {
    s = addPoint(s, ch === 'A' ? 'A' : 'B');
  }
  return s;
};

describe('SMOKE · Vôlei amador 3 sets', () => {
  it('jogo até match point + finaliza com placar correto', () => {
    let s = createScoreboard(VOLLEY_AMATEUR);

    // Set 1: A vence 25-22 (alterna pra não fechar antes da hora)
    s = playSequence(s, 'A'.repeat(22) + 'B'.repeat(22) + 'AAA');
    expect(setsWonByTeams(s)).toEqual({ a: 1, b: 0 });
    expect(s.currentSetIndex).toBe(1);

    // Set 2: B vence 22-25
    s = playSequence(s, 'A'.repeat(22) + 'B'.repeat(22) + 'BBB');
    expect(setsWonByTeams(s)).toEqual({ a: 1, b: 1 });
    expect(s.currentSetIndex).toBe(2);

    // Set 3 decisivo (15 pts): A vai pra 14, B pra 13 → match point
    s = playSequence(s, 'A'.repeat(13) + 'B'.repeat(13) + 'A');
    expect(currentSetScore(s)).toEqual({ a: 14, b: 13 });
    expect(matchPointStatus(s)).toEqual({ team: 'A', type: 'match_point' });

    // Próximo ponto fecha o jogo
    s = addPoint(s, 'A');
    expect(s.status).toBe('finished');
    expect(s.winner).toBe('A');
    expect(setsWonByTeams(s)).toEqual({ a: 2, b: 1 });
  });

  it('share text mostra resultado final com branding', () => {
    let s = createScoreboard(VOLLEY_AMATEUR);
    s = playSequence(s, 'A'.repeat(20) + 'B'.repeat(20) + 'AAAAA');
    s = playSequence(s, 'A'.repeat(22) + 'B'.repeat(22) + 'AAA');
    expect(s.status).toBe('finished');

    const text = formatScoreboardResult(s);
    expect(text).toContain('Time Verde');
    expect(text).toContain('Vôlei amador');
    expect(text).toContain('finalizado');
    expect(text).toContain('🏆');
    expect(text).toContain('Timeco');
  });
});

describe('SMOKE · Truco 1 set', () => {
  it('jogo termina ao atingir 12 pontos sem vantagem', () => {
    let s = createScoreboard(TRUCO);

    // 11 a 11
    s = playSequence(s, 'A'.repeat(11) + 'B'.repeat(11));
    expect(s.status).toBe('in_progress');

    // 12 a 11 → A vence (sem vantagem de 2)
    s = addPoint(s, 'A');
    expect(s.status).toBe('finished');
    expect(s.winner).toBe('A');
  });

  it('subtitle correto via formatScoreboardResult', () => {
    let s = createScoreboard(TRUCO);
    s = playSequence(s, 'A'.repeat(8) + 'B'.repeat(8) + 'AAAA');

    const text = formatScoreboardResult(s);
    expect(text).toContain('Truco');
    expect(text).toContain('Nós');
    expect(text).not.toContain('Set 1/'); // não tem múltiplos sets
  });
});

describe('SMOKE · Undo + reset (caixa branca)', () => {
  it('undo do ponto que fecha o set reabre o set', () => {
    let s = createScoreboard(VOLLEY_AMATEUR);
    // 24-22, próximo A fecha 25-22
    s = playSequence(s, 'A'.repeat(22) + 'B'.repeat(22) + 'AAA');
    expect(s.currentSetIndex).toBe(1);
    expect(s.sets[0].finished).toBe(true);

    // Undo: deve reabrir o set 1 e voltar pra current=0
    s = undoLastPoint(s);
    expect(s.currentSetIndex).toBe(0);
    expect(s.sets[0].finished).toBe(false);
    expect(currentSetScore(s)).toEqual({ a: 24, b: 22 });
  });

  it('reset zera tudo mas mantém config', () => {
    let s = createScoreboard(VOLLEY_AMATEUR);
    s = playSequence(s, 'A'.repeat(20) + 'B'.repeat(20));

    s = resetMatch(s);
    expect(s.config.modalityLabel).toBe('Vôlei amador');
    expect(s.sets).toHaveLength(1);
    expect(s.history).toEqual([]);
    expect(s.currentSetIndex).toBe(0);
    expect(currentSetScore(s)).toEqual({ a: 0, b: 0 });
  });
});

describe('SMOKE · Edge cases (caixa preta)', () => {
  it('vantagem de 2 prolonga set quando 24-24', () => {
    let s = createScoreboard(VOLLEY_AMATEUR);
    s = playSequence(s, 'A'.repeat(24) + 'B'.repeat(24));
    expect(s.sets[0].finished).toBe(false);

    // 25-24 ainda não fecha
    s = addPoint(s, 'A');
    expect(s.sets[0].finished).toBe(false);

    // 26-24 fecha
    s = addPoint(s, 'A');
    expect(s.sets[0].finished).toBe(true);
  });

  it('addPoint após finished não muta o estado', () => {
    let s = createScoreboard(TRUCO);
    s = playSequence(s, 'A'.repeat(12));
    expect(s.status).toBe('finished');

    const before = JSON.stringify(s);
    s = addPoint(s, 'A');
    expect(JSON.stringify(s)).toBe(before);
  });
});
