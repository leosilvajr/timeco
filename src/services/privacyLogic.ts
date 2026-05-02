import { User } from '../types';

/**
 * Decide se um observador (viewer) pode ver o perfil completo do alvo.
 * Regras:
 * - O próprio usuário sempre pode ver (self).
 * - Amigos sempre podem ver.
 * - Estranhos só veem se o perfil é público (default true caso indefinido).
 */
export const canViewFullProfile = (
  viewer: User | null,
  target: User,
  isFriend: boolean,
): boolean => {
  if (!viewer) return target.isProfilePublic !== false;
  if (viewer.id === target.id) return true;
  if (isFriend) return true;
  return target.isProfilePublic !== false;
};

/**
 * Decide se a galeria de fotos do alvo é visível pro viewer.
 * Mesmas regras: self → sempre, amigo → sempre, estranho → só se pública.
 */
export const canViewGallery = (
  viewer: User | null,
  target: User,
  isFriend: boolean,
): boolean => {
  if (!viewer) return target.isGalleryPublic !== false;
  if (viewer.id === target.id) return true;
  if (isFriend) return true;
  return target.isGalleryPublic !== false;
};
