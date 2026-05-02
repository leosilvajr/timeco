/**
 * Lógica pura de rodízio de vôlei.
 *
 * No vôlei tradicional, a rotação ocorre no sentido HORÁRIO quando o time
 * recebe o saque (sideout). O array de 6 posições mapeia índice → posição
 * de quadra: [pos1, pos2, pos3, pos4, pos5, pos6].
 *
 * - Posição 1: sacador (fundo direita)
 * - Posições 2, 3, 4: rede (direita, meio, esquerda)
 * - Posições 5, 6: fundo (meio, esquerda)
 *
 * Numa rotação horária, quem está na posição 2 vai pra 1, da 3 vai pra 2, etc.
 * E quem estava na 1 vai pra 6.
 */

export type Rotation = number[];

export const isValidRotation = (r: Rotation): boolean => {
  if (r.length !== 6) return false;
  // Aceita 0 como "vazio" temporariamente; mas IDs de jogador devem ser únicos.
  const filled = r.filter((n) => n !== 0 && n !== null && n !== undefined);
  const unique = new Set(filled);
  return unique.size === filled.length;
};

/**
 * Rotaciona horário (sideout). Quem estava na posição 2 (índice 1) vai pra 1
 * (índice 0), e assim por diante. O sacador (índice 0) vai pra trás (índice 5).
 *
 * Implementação: shift left circular.
 */
export const rotateForward = (r: Rotation): Rotation => {
  if (r.length !== 6) throw new Error('Rotation precisa ter exatamente 6 posições');
  return [r[1], r[2], r[3], r[4], r[5], r[0]];
};

/** Rotação anti-horária (desfaz uma rotação). Inverso de rotateForward. */
export const rotateBackward = (r: Rotation): Rotation => {
  if (r.length !== 6) throw new Error('Rotation precisa ter exatamente 6 posições');
  return [r[5], r[0], r[1], r[2], r[3], r[4]];
};

export interface PointResult {
  rotation: Rotation;
  serveTeam: 'A' | 'B';
  rotated: boolean;
}

/**
 * Aplica um ponto e calcula a nova rotação + sideout.
 *
 * Regras:
 * - Se o time que pontuou JÁ estava sacando: marca apenas o ponto. Sem rotação.
 * - Se o time que pontuou NÃO estava sacando (sideout): vira o saque para ele.
 *   - Se este time é a equipe da quadra (A) E `autoRotation` está ligado, gira
 *     a rotação 1 vez (rodízio horário).
 *   - Se é a equipe adversária (B), nunca giramos a rotação local.
 */
export const applyPoint = (
  rotation: Rotation,
  currentServe: 'A' | 'B',
  pointTeam: 'A' | 'B',
  autoRotation: boolean,
): PointResult => {
  // Sem sideout — quem sacava continua sacando, sem rotação.
  if (currentServe === pointTeam) {
    return { rotation, serveTeam: pointTeam, rotated: false };
  }
  // Sideout: o ponto foi de quem RECEBEU.
  // Se foi nossa equipe (A) e autoRotation está ligado, giramos.
  if (pointTeam === 'A' && autoRotation) {
    return {
      rotation: rotateForward(rotation),
      serveTeam: 'A',
      rotated: true,
    };
  }
  // Caso contrário só muda o saque sem girar (B sacando ou auto desligado).
  return { rotation, serveTeam: pointTeam, rotated: false };
};

/** Padrão sequencial: posição 1 = jogador 1, posição 2 = jogador 2, ... */
export const defaultRotation = (playerNumbers: number[]): Rotation => {
  const r: Rotation = new Array(6).fill(0);
  for (let i = 0; i < Math.min(6, playerNumbers.length); i++) {
    r[i] = playerNumbers[i];
  }
  return r;
};

export type CourtZone = 'serve' | 'net' | 'back';

/** Zona da posição (1 = sacador, 2/3/4 = rede, 5/6 = fundo). */
export const positionZone = (position: number): CourtZone => {
  if (position === 1) return 'serve';
  if (position === 2 || position === 3 || position === 4) return 'net';
  return 'back';
};
