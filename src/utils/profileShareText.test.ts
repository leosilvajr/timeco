import { profilePublicUrl, formatProfileShare } from './profileShareText';
import { User } from '../types';

const baseUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user_abc',
    email: 'a@b.com',
    name: 'João Silva',
    role: 'user',
    createdAt: null,
    ...overrides,
  } as User);

describe('profilePublicUrl', () => {
  it('aponta pro path /u/[userId] no domínio principal', () => {
    expect(profilePublicUrl('user_abc')).toBe('https://timeco.com.br/u/user_abc');
  });
});

describe('formatProfileShare', () => {
  it('texto self menciona "meu perfil"', () => {
    const txt = formatProfileShare(baseUser(), true);
    expect(txt).toContain('meu perfil');
    expect(txt).toContain('https://timeco.com.br/u/user_abc');
  });

  it('texto não-self menciona o nome', () => {
    const txt = formatProfileShare(baseUser({ name: 'Maria' }), false);
    expect(txt).toContain('Maria');
    expect(txt).not.toContain('meu perfil');
  });

  it('inclui bio entre aspas se houver', () => {
    const txt = formatProfileShare(baseUser({ bio: 'Jogo handebol' }), true);
    expect(txt).toContain('"Jogo handebol"');
  });

  it('omite bio quando ausente', () => {
    const txt = formatProfileShare(baseUser({ bio: undefined }), true);
    expect(txt).not.toMatch(/^"/m);
  });

  it('inclui branding do Timeco', () => {
    const txt = formatProfileShare(baseUser(), true);
    expect(txt).toContain('Timeco');
    expect(txt).toContain('https://timeco.com.br');
  });
});
