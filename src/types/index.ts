import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'superadmin';

export type SportId =
  | 'soccer'
  | 'futsal'
  | 'volleyball'
  | 'beachVolley'
  | 'basketball'
  | 'handball'
  | 'tableTennis'
  | 'tennis'
  | 'padel'
  | 'beachTennis'
  | 'badminton'
  | 'squash'
  | 'pickleball'
  | 'chess'
  | 'pool'
  | 'esports'
  | 'other';

export type Gender = 'male' | 'female' | 'other' | 'not_specified';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  birthDate?: string;
  heightCm?: number;
  gender?: Gender;
  phone?: string;
  /** Bio curta exibida no perfil público (opcional). */
  bio?: string;
  /** Esportes preferidos exibidos no perfil público. */
  favoriteSports?: SportId[];
  createdAt: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface Friendship {
  id: string;
  members: [string, string];
  createdAt: Timestamp | Date | null;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  status: FriendRequestStatus;
  createdAt: Timestamp | Date | null;
}

export type EventStatus = 'open' | 'teams_drawn' | 'finished' | 'cancelled';

export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined';

export interface EventConfirmation {
  userId: string;
  status: ConfirmationStatus;
  confirmedAt?: Timestamp | Date | null;
}

export interface DrawnTeam {
  name: string;
  color: string;
  playerIds: string[];
  totalStars: number;
}

export interface Event {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  sport: SportId;
  location: string;
  scheduledAt: Timestamp | Date | null;
  playersPerTeam: number;
  teamsCount: number;
  balanceByAge: boolean;
  balanceByHeight: boolean;
  invitedUserIds: string[];
  confirmations: Record<string, ConfirmationStatus>;
  teams?: DrawnTeam[];
  drawnAt?: Timestamp | Date | null;
  status: EventStatus;
  notes?: string;
  createdAt: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface PlayerRating {
  id: string;
  eventId: string;
  playerUserId: string;
  stars: number;
  ratedByUserId: string;
  updatedAt: Timestamp | Date | null;
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'event_invite'
  | 'event_updated'
  | 'teams_drawn'
  | 'event_cancelled'
  | 'chat_message';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp | Date | null;
}

// ====== CHAT ======

/** doc id = `${uidA}_${uidB}` (uids em ordem alfabética) */
export interface Chat {
  id: string;
  members: [string, string];
  lastMessage?: string;
  lastMessageAt?: Timestamp | Date | null;
  lastSenderId?: string;
  createdAt: Timestamp | Date | null;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp | Date | null;
}

// ====== VOLLEY SCOUT (modo avançado de vôlei) ======

export type VolleyPosition = 'Oposto' | 'Ponteiro' | 'Central' | 'Levantador' | 'Líbero';

export interface VolleyPlayer {
  /** Nome do jogador. */
  name: string;
  /** Número da camisa (1-99, único na equipe). */
  number: number;
  position: VolleyPosition;
}

/** Estatísticas de um jogador num set. Todos os contadores começam em 0. */
export interface PlayerVolleyStats {
  attacks: { success: number; error: number; normal: number };
  serves: { success: number; error: number; ace: number };
  blocks: { success: number; error: number };
  passes: { a: number; b: number; c: number };
  sets: {
    success: number;
    error: number;
    ponta: number;
    saida: number;
    meio: number;
    fundo_meio: number;
    fundo_saida: number;
  };
}

export type VolleyAction =
  | 'serve_success'
  | 'serve_error'
  | 'ace'
  | 'attack_point'
  | 'attack'
  | 'attack_error'
  | 'pass_a'
  | 'pass_b'
  | 'pass_c'
  | 'block_success'
  | 'block_error'
  | 'set_success'
  | 'set_error'
  | 'set_ponta'
  | 'set_saida'
  | 'set_meio'
  | 'set_fundo_meio'
  | 'set_fundo_saida';

export interface VolleySetData {
  /** Número do set (1-5). */
  number: number;
  scoreA: number;
  scoreB: number;
  finished: boolean;
  /** Mapa: número da camisa → estatísticas. */
  playerStats: Record<number, PlayerVolleyStats>;
}

export type VolleyFormat = 3 | 5;

export type VolleyRotationSystem = '5x1' | '4x2' | '6x0';

export type VolleyMatchStatus = 'in_progress' | 'finished';

export interface VolleyPointHistoryEntry {
  team: 'A' | 'B';
  /** Snapshot da rotação ANTES desse ponto (para undo). */
  rotationBefore: number[];
  /** Time que estava sacando ANTES desse ponto. */
  serveBefore: 'A' | 'B';
}

export interface VolleyMatch {
  id: string;
  ownerId: string;
  /** ISO date YYYY-MM-DD. */
  date: string;
  location: string;
  teamAName: string;
  teamBName: string;
  format: VolleyFormat;
  status: VolleyMatchStatus;
  /** Set ativo (1-5). */
  currentSet: number;
  /** Jogadores cadastrados (apenas equipe A — a do usuário). */
  players: VolleyPlayer[];
  /** Sets jogados, em ordem (1, 2, 3, ...). */
  sets: VolleySetData[];
  /** Sistema de rodízio em uso. */
  rotationSystem: VolleyRotationSystem;
  /** Posições iniciais (números das camisas em ordem 1..6). */
  initialRotation: number[];
  /** Posições atuais (mesma ordem). */
  currentRotation: number[];
  /** Total de rotações feitas. */
  rotationCount: number;
  /** Total de pontos no jogo (controle interno). */
  pointsCount: number;
  /** Time que está sacando agora. */
  serveTeam: 'A' | 'B';
  /** Histórico de pontos para suportar undo. */
  pointHistory: VolleyPointHistoryEntry[];
  createdAt: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}
