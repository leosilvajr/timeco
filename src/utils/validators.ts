/**
 * Validadores puros reusáveis em telas e services.
 *
 * Convenção: cada `is*` retorna boolean. Mensagens de erro ficam nas
 * telas (próximas ao input) — aqui só a regra.
 */

// ============= Email =============

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string): boolean =>
  EMAIL_REGEX.test(email.trim().toLowerCase());

// ============= Numbers =============

/** Limita um valor entre min e max inclusivos. */
export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

/** Altura humana plausível em cm (sanity check, não medical). */
export const HEIGHT_MIN_CM = 100;
export const HEIGHT_MAX_CM = 250;
export const isValidHeight = (cm: number | null | undefined): boolean =>
  cm != null && Number.isFinite(cm) && cm >= HEIGHT_MIN_CM && cm <= HEIGHT_MAX_CM;

/** Peso humano plausível em kg. */
export const WEIGHT_MIN_KG = 30;
export const WEIGHT_MAX_KG = 250;
export const isValidWeight = (kg: number | null | undefined): boolean =>
  kg != null && Number.isFinite(kg) && kg >= WEIGHT_MIN_KG && kg <= WEIGHT_MAX_KG;

/** Número de camisa do jogador (1-99). */
export const isValidJerseyNumber = (n: number): boolean =>
  Number.isInteger(n) && n >= 1 && n <= 99;

/** Quantidade de times num evento (2-8). */
export const TEAMS_COUNT_MIN = 2;
export const TEAMS_COUNT_MAX = 8;
export const isValidTeamsCount = (n: number): boolean =>
  Number.isInteger(n) && n >= TEAMS_COUNT_MIN && n <= TEAMS_COUNT_MAX;

/** Jogadores por time (1-30 — cobre desde xadrez até futebol). */
export const PLAYERS_PER_TEAM_MIN = 1;
export const PLAYERS_PER_TEAM_MAX = 30;
export const isValidPlayersPerTeam = (n: number): boolean =>
  Number.isInteger(n) && n >= PLAYERS_PER_TEAM_MIN && n <= PLAYERS_PER_TEAM_MAX;

// ============= Dates =============

/**
 * Verifica se a data/hora informada é futura (>= agora).
 * Aceita date no formato 'YYYY-MM-DD' e time 'HH:MM'.
 */
export const isFutureDateTime = (dateStr: string, timeStr: string): boolean => {
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(dt.getTime())) return false;
  return dt.getTime() > Date.now();
};

/**
 * Verifica se a data de nascimento é válida — passada e não absurda
 * (<= 120 anos atrás).
 */
export const isValidBirthDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = Date.now();
  const t = d.getTime();
  if (t > now) return false;
  const oldestPlausible = now - 120 * 365.25 * 24 * 3600 * 1000;
  return t > oldestPlausible;
};

// ============= Strings =============

/** Limites máximos pra evitar abuso (textos enormes vão pra Firestore). */
export const MAX_NAME_LEN = 80;
export const MAX_BIO_LEN = 500;
export const MAX_TITLE_LEN = 100;
export const MAX_NOTES_LEN = 500;
export const MAX_LOCATION_LEN = 200;
export const MAX_TEAM_NAME_LEN = 50;

/**
 * Testa se uma string passa numa janela de tamanho mínimo + máximo
 * (após trim). Vazio sempre falha — use validators específicos pra
 * campos opcionais.
 */
export const isWithinLength = (s: string, min: number, max: number): boolean => {
  const t = s.trim();
  return t.length >= min && t.length <= max;
};
