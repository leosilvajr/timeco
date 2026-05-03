import { formatScoreboardResult } from './scoreboardShareText';
import { ScoreboardState } from '../services/scoreboardLogic';

const baseState = (overrides: Partial<ScoreboardState> = {}): ScoreboardState => ({
  config: {
    teamAName: 'Time Verde',
    teamBName: 'Time Azul',
    pointsToWin: 25,
    winByTwo: true,
    bestOfSets: 3,
    modalityLabel: 'Vôlei amador',
  },
  sets: [
    { a: 25, b: 22, finished: true, winner: 'A' },
    { a: 23, b: 25, finished: true, winner: 'B' },
    { a: 25, b: 19, finished: true, winner: 'A' },
  ],
  currentSetIndex: 2,
  status: 'finished',
  winner: 'A',
  history: [],
  ...overrides,
});

describe('formatScoreboardResult', () => {
  it('mostra placar de sets finais corretamente', () => {
    const txt = formatScoreboardResult(baseState());
    expect(txt).toContain('Time Verde');
    expect(txt).toContain('Time Azul');
    expect(txt).toContain('2 × 1');
  });

  it('marca o vencedor com troféu', () => {
    const txt = formatScoreboardResult(baseState());
    expect(txt).toContain('🏆');
  });

  it('inclui modalidade no cabeçalho', () => {
    const txt = formatScoreboardResult(baseState());
    expect(txt).toContain('Vôlei amador');
    expect(txt).toContain('finalizado');
  });

  it('lista cada set jogado com placar', () => {
    const txt = formatScoreboardResult(baseState());
    expect(txt).toContain('1) 25 × 22');
    expect(txt).toContain('2) 23 × 25');
    expect(txt).toContain('3) 25 × 19');
  });

  it('marca "em andamento" quando partida não acabou', () => {
    const ongoing = baseState({
      status: 'in_progress',
      winner: undefined,
      sets: [
        { a: 25, b: 22, finished: true, winner: 'A' },
        { a: 18, b: 14, finished: false },
      ],
      currentSetIndex: 1,
    });
    const txt = formatScoreboardResult(ongoing);
    expect(txt).toContain('em andamento');
    expect(txt).not.toContain('finalizado');
    expect(txt).toContain('(em andamento)'); // tag no set não-finalizado
  });

  it('inclui branding do Timeco no rodapé', () => {
    const txt = formatScoreboardResult(baseState());
    expect(txt).toContain('Placar feito no Timeco');
    expect(txt).toContain('https://timeco.com.br');
  });

  it('funciona sem modalityLabel', () => {
    const noLabel = baseState({
      config: { ...baseState().config, modalityLabel: undefined },
    });
    expect(() => formatScoreboardResult(noLabel)).not.toThrow();
  });
});
