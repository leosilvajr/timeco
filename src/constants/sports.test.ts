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
