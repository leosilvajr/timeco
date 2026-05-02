import { drawTeams, PlayerWithRating } from './teamDrawService';
import { User } from '../types';

const makeUser = (id: string, partial: Partial<User> = {}): User => ({
  id,
  email: `${id}@x.com`,
  name: id,
  role: 'user',
  createdAt: null,
  ...partial,
});

const makePlayers = (
  count: number,
  stars: (i: number) => number = () => 3,
): PlayerWithRating[] =>
  Array.from({ length: count }, (_, i) => ({ user: makeUser(`u${i}`), stars: stars(i) }));

describe('drawTeams', () => {
  describe('validações', () => {
    it('lança erro com menos de 2 times', () => {
      expect(() => drawTeams({ players: makePlayers(4), teamsCount: 1 })).toThrow(
        /2 times/,
      );
    });

    it('lança erro com 0 times', () => {
      expect(() => drawTeams({ players: makePlayers(4), teamsCount: 0 })).toThrow();
    });

    it('lança erro quando há menos jogadores do que times', () => {
      expect(() => drawTeams({ players: makePlayers(1), teamsCount: 2 })).toThrow(
        /insuficientes/,
      );
    });
  });

  describe('estrutura do resultado', () => {
    it('cria N times', () => {
      const teams = drawTeams({ players: makePlayers(8), teamsCount: 4 });
      expect(teams).toHaveLength(4);
    });

    it('atribui nome e cor a cada time a partir do catálogo', () => {
      const teams = drawTeams({ players: makePlayers(8), teamsCount: 2 });
      expect(teams[0].name).toBe('Time Verde');
      expect(teams[0].color).toBe('#0F9D58');
      expect(teams[1].name).toBe('Time Amarelo');
      expect(teams[1].color).toBe('#F4B400');
    });

    it('atribui todos os jogadores e nenhum jogador é duplicado', () => {
      const players = makePlayers(10);
      const teams = drawTeams({ players, teamsCount: 2 });
      const allIds = teams.flatMap((t) => t.playerIds);
      expect(allIds).toHaveLength(players.length);
      expect(new Set(allIds).size).toBe(players.length);
      const expectedIds = new Set(players.map((p) => p.user.id));
      expect(new Set(allIds)).toEqual(expectedIds);
    });

    it('soma das estrelas dos times bate com soma das estrelas dos jogadores', () => {
      const players = makePlayers(8, (i) => (i % 5) + 1);
      const teams = drawTeams({ players, teamsCount: 2 });
      const expected = players.reduce((acc, p) => acc + p.stars, 0);
      const actual = teams.reduce((acc, t) => acc + t.totalStars, 0);
      expect(actual).toBeCloseTo(expected, 2);
    });
  });

  describe('balanceamento (snake-draft)', () => {
    it('quando todos têm a mesma estrela os times ficam empatados', () => {
      const teams = drawTeams({ players: makePlayers(8, () => 3), teamsCount: 2 });
      expect(teams[0].totalStars).toBe(teams[1].totalStars);
    });

    it('com pares simétricos de estrela a diferença é pequena', () => {
      const players: PlayerWithRating[] = [
        { user: makeUser('a'), stars: 5 },
        { user: makeUser('b'), stars: 5 },
        { user: makeUser('c'), stars: 4 },
        { user: makeUser('d'), stars: 4 },
        { user: makeUser('e'), stars: 3 },
        { user: makeUser('f'), stars: 3 },
        { user: makeUser('g'), stars: 2 },
        { user: makeUser('h'), stars: 2 },
      ];
      const teams = drawTeams({ players, teamsCount: 2 });
      const diff = Math.abs(teams[0].totalStars - teams[1].totalStars);
      expect(diff).toBeLessThanOrEqual(1);
    });

    it('distribui jogadores quase uniformemente entre os times', () => {
      const teams = drawTeams({ players: makePlayers(12), teamsCount: 3 });
      const sizes = teams.map((t) => t.playerIds.length);
      const max = Math.max(...sizes);
      const min = Math.min(...sizes);
      expect(max - min).toBeLessThanOrEqual(1);
    });
  });

  describe('balanceByHeight', () => {
    it('aumenta o peso de jogadores mais altos (afeta o resultado)', () => {
      // 4 jogadores, mesma estrela, mas 2 muito altos.
      // Sem balanceByHeight: serpentina aleatória → empate em estrelas.
      // Com balanceByHeight: peso alto → vão para times opostos primeiro.
      const players: PlayerWithRating[] = [
        { user: makeUser('alto1', { heightCm: 200 }), stars: 3 },
        { user: makeUser('alto2', { heightCm: 200 }), stars: 3 },
        { user: makeUser('baixo1', { heightCm: 160 }), stars: 3 },
        { user: makeUser('baixo2', { heightCm: 160 }), stars: 3 },
      ];
      const teams = drawTeams({
        players,
        teamsCount: 2,
        balanceByHeight: true,
      });
      // cada time deve ter 1 alto + 1 baixo (snake-draft com pesos diferentes)
      const highs = new Set(['alto1', 'alto2']);
      const team0HasHigh = teams[0].playerIds.some((id) => highs.has(id));
      const team1HasHigh = teams[1].playerIds.some((id) => highs.has(id));
      expect(team0HasHigh && team1HasHigh).toBe(true);
    });
  });
});
