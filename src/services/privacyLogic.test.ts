import { canViewFullProfile, canViewGallery } from './privacyLogic';
import { User } from '../types';

const make = (id: string, partial: Partial<User> = {}): User => ({
  id,
  email: `${id}@x.com`,
  name: id,
  role: 'user',
  createdAt: null,
  ...partial,
});

describe('canViewFullProfile', () => {
  it('próprio usuário sempre vê', () => {
    const u = make('a', { isProfilePublic: false });
    expect(canViewFullProfile(u, u, false)).toBe(true);
  });

  it('amigo vê mesmo se privado', () => {
    const target = make('b', { isProfilePublic: false });
    const viewer = make('a');
    expect(canViewFullProfile(viewer, target, true)).toBe(true);
  });

  it('estranho não vê quando privado', () => {
    const target = make('b', { isProfilePublic: false });
    const viewer = make('a');
    expect(canViewFullProfile(viewer, target, false)).toBe(false);
  });

  it('estranho vê quando público (default)', () => {
    const target = make('b'); // isProfilePublic indefinido = público
    const viewer = make('a');
    expect(canViewFullProfile(viewer, target, false)).toBe(true);
  });

  it('estranho vê quando explicitamente público', () => {
    const target = make('b', { isProfilePublic: true });
    const viewer = make('a');
    expect(canViewFullProfile(viewer, target, false)).toBe(true);
  });

  it('viewer null (não logado) respeita privacidade do target', () => {
    expect(canViewFullProfile(null, make('b', { isProfilePublic: false }), false)).toBe(false);
    expect(canViewFullProfile(null, make('b'), false)).toBe(true);
  });
});

describe('canViewGallery', () => {
  it('próprio usuário sempre vê', () => {
    const u = make('a', { isGalleryPublic: false });
    expect(canViewGallery(u, u, false)).toBe(true);
  });

  it('amigo vê mesmo se privada', () => {
    const target = make('b', { isGalleryPublic: false });
    expect(canViewGallery(make('a'), target, true)).toBe(true);
  });

  it('estranho não vê quando privada', () => {
    expect(canViewGallery(make('a'), make('b', { isGalleryPublic: false }), false)).toBe(false);
  });

  it('default (indefinido) é público', () => {
    expect(canViewGallery(make('a'), make('b'), false)).toBe(true);
  });

  it('configurações são independentes (perfil privado, galeria pública)', () => {
    const target = make('b', { isProfilePublic: false, isGalleryPublic: true });
    expect(canViewFullProfile(make('a'), target, false)).toBe(false);
    expect(canViewGallery(make('a'), target, false)).toBe(true);
  });
});
