import { computeProfileCompletion } from './useProfileCompletion';
import { User } from '../types';

const baseUser: User = {
  id: '1',
  email: 'a@b.c',
  name: 'A',
  role: 'user',
  createdAt: null,
};

describe('computeProfileCompletion', () => {
  it('user nulo retorna 0% e todos campos faltando', () => {
    const r = computeProfileCompletion(null);
    expect(r.percent).toBe(0);
    expect(r.filled).toBe(0);
    expect(r.isComplete).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it('user só com obrigatórios mínimos: 0% (nenhum campo opcional preenchido)', () => {
    const r = computeProfileCompletion(baseUser);
    expect(r.filled).toBe(0);
    expect(r.percent).toBe(0);
    expect(r.isComplete).toBe(false);
  });

  it('preenche campo crítico → reflete em filled e percent', () => {
    const u: User = { ...baseUser, birthDate: '1990-05-15' };
    const r = computeProfileCompletion(u);
    expect(r.filled).toBe(1);
    expect(r.missing.find((f) => f.key === 'birthDate')).toBeUndefined();
    expect(r.missingCritical.find((f) => f.key === 'birthDate')).toBeUndefined();
  });

  it('user 100% completo retorna isComplete=true', () => {
    const u: User = {
      ...baseUser,
      birthDate: '1990-01-01',
      heightCm: 180,
      weightKg: 75,
      phone: '11999990000',
      bio: 'jogo bola',
      favoriteSports: ['soccer'],
    };
    const r = computeProfileCompletion(u);
    expect(r.isComplete).toBe(true);
    expect(r.percent).toBe(100);
    expect(r.missing).toHaveLength(0);
  });

  it('separa missingCritical (afeta sorteio) de missing (todo)', () => {
    const u: User = { ...baseUser, bio: 'algo', favoriteSports: ['tennis'] };
    const r = computeProfileCompletion(u);
    // 4 críticos faltando: birthDate, heightCm, weightKg
    // (phone não é crítico, mas falta)
    expect(r.missingCritical.length).toBe(3);
    expect(r.missing.length).toBe(4);
  });

  it('campo string vazio "" conta como faltante', () => {
    const u: User = { ...baseUser, bio: '   ', phone: '' };
    const r = computeProfileCompletion(u);
    expect(r.missing.find((f) => f.key === 'bio')).toBeDefined();
    expect(r.missing.find((f) => f.key === 'phone')).toBeDefined();
  });

  it('favoriteSports vazio array conta como faltante', () => {
    const u: User = { ...baseUser, favoriteSports: [] };
    const r = computeProfileCompletion(u);
    expect(r.missing.find((f) => f.key === 'favoriteSports')).toBeDefined();
  });
});
