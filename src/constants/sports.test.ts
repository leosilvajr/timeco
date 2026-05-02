import { SPORTS, getSport } from './sports';
import { SportId } from '../types';

describe('catálogo SPORTS', () => {
  it('todos os ids são únicos', () => {
    const ids = SPORTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contém o esporte "other" como fallback', () => {
    expect(SPORTS.some((s) => s.id === 'other')).toBe(true);
  });

  it('todos os esportes têm defaults razoáveis', () => {
    for (const s of SPORTS) {
      expect(s.defaultPlayersPerTeam).toBeGreaterThanOrEqual(1);
      expect(s.defaultTeamsCount).toBeGreaterThanOrEqual(2);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.emoji.length).toBeGreaterThan(0);
    }
  });
});

describe('getSport', () => {
  it('retorna o esporte correto quando id existe', () => {
    expect(getSport('soccer').label).toBe('Futebol');
    expect(getSport('volleyball').usesHeightBalance).toBe(true);
    expect(getSport('soccer').usesAgeBalance).toBe(true);
  });

  it('retorna "other" como fallback para id desconhecido', () => {
    const fake = 'inexistente' as SportId;
    expect(getSport(fake).id).toBe('other');
  });
});

describe('esportes 1v1', () => {
  const oneVsOneIds: SportId[] = [
    'tennis', 'tableTennis', 'badminton', 'squash',
    'chess', 'pool', 'esports',
  ];

  it.each(oneVsOneIds)('%s é configurado como 1v1 (1 por time, 2 times)', (id) => {
    const cfg = getSport(id);
    expect(cfg.defaultPlayersPerTeam).toBe(1);
    expect(cfg.defaultTeamsCount).toBe(2);
    expect(cfg.isOneVsOne).toBe(true);
  });

  it('esportes coletivos não são marcados como 1v1', () => {
    expect(getSport('soccer').isOneVsOne).toBeFalsy();
    expect(getSport('volleyball').isOneVsOne).toBeFalsy();
    expect(getSport('basketball').isOneVsOne).toBeFalsy();
  });
});

describe('novas modalidades adicionadas', () => {
  const newSports: SportId[] = [
    'padel', 'beachTennis', 'badminton', 'squash',
    'pickleball', 'chess', 'pool', 'esports',
  ];

  it.each(newSports)('%s existe no catálogo', (id) => {
    expect(SPORTS.find((s) => s.id === id)).toBeDefined();
  });
});
