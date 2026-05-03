import { User } from '../types';

const PUBLIC_BASE = 'https://timeco.com.br/u';

/** URL pública do perfil (rota /u/[userId] no landing). */
export const profilePublicUrl = (userId: string): string => `${PUBLIC_BASE}/${userId}`;

/**
 * Texto pronto pra compartilhar o perfil de um user.
 * Funciona pra perfil próprio (self=true) ou de terceiro.
 */
export const formatProfileShare = (user: User, self: boolean): string => {
  const lines: string[] = [];
  if (self) {
    lines.push(`👤  Confere meu perfil no Timeco`);
  } else {
    lines.push(`👤  Confere o perfil de ${user.name} no Timeco`);
  }
  if (user.bio) {
    lines.push(`"${user.bio}"`);
  }
  lines.push('');
  lines.push(profilePublicUrl(user.id));
  lines.push('');
  lines.push('🎲 Timeco · times equilibrados em segundos');
  lines.push('https://timeco.com.br');
  return lines.join('\n');
};
