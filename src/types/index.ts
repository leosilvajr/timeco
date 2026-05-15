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
  /**
   * Peso em kg. Opcional. **Dado privado**: usado apenas em cálculos
   * internos de sorteio quando o esporte considera. NUNCA é exibido
   * em perfis públicos ou na rede social.
   */
  weightKg?: number;
  gender?: Gender;
  phone?: string;
  /** Bio curta exibida no perfil público (opcional). */
  bio?: string;
  /** Esportes preferidos exibidos no perfil público. */
  favoriteSports?: SportId[];
  /**
   * Quando false, somente amigos veem o perfil completo. Estranhos só
   * veem nome + foto. Default true (público) caso não definido.
   */
  isProfilePublic?: boolean;
  /**
   * Quando false, a galeria de fotos das partidas não aparece no perfil
   * público. Default true.
   */
  isGalleryPublic?: boolean;
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

export interface EventLocation {
  /** Endereço completo (display_name do OSM) */
  address: string;
  lat: number;
  lng: number;
}

export interface Event {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  sport: SportId;
  /** Nome curto do local (ex: "Arena XPTO"). Sempre presente. */
  location: string;
  /** Localização completa com coordenadas (opcional, presente quando o
   * organizador escolheu via mapa). */
  locationDetails?: EventLocation;
  scheduledAt: Timestamp | Date | null;
  playersPerTeam: number;
  teamsCount: number;
  balanceByAge: boolean;
  balanceByHeight: boolean;
  /**
   * Quando true, o sorteio considera o peso (dos jogadores que tiverem
   * informado) como critério adicional de equilíbrio. Tipicamente true
   * em esportes de contato físico (futebol, basquete, handebol).
   */
  balanceByWeight?: boolean;
  invitedUserIds: string[];
  confirmations: Record<string, ConfirmationStatus>;
  teams?: DrawnTeam[];
  drawnAt?: Timestamp | Date | null;
  status: EventStatus;
  notes?: string;
  createdAt: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface EventPhoto {
  id: string;
  eventId: string;
  uploaderId: string;
  uploaderName: string;
  url: string;
  storagePath: string;
  caption?: string;
  createdAt: Timestamp | Date | null;
}

/**
 * Foto pessoal do perfil — adicionada diretamente pelo dono,
 * fora do contexto de eventos. Aparece na aba "Minhas fotos".
 */
export interface ProfilePhoto {
  id: string;
  ownerId: string;
  url: string;
  storagePath: string;
  caption?: string;
  createdAt: Timestamp | Date | null;
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

/**
 * Time cadastrado de volei (reutilizavel em multiplas partidas).
 * Doc em volleyTeams/{teamId}. Apenas o ownerId pode ler/escrever.
 */
export interface VolleyTeam {
  id: string;
  ownerId: string;
  name: string;
  players: VolleyPlayer[];
  createdAt: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

/** Estatísticas de um jogador num set. Todos os contadores começam em 0. */
export interface PlayerVolleyStats {
  attacks: { success: number; error: number; normal: number };
  serves: { success: number; error: number; ace: number };
  /** normal = bloqueou mas nao foi ponto (continuou jogo). */
  blocks: { success: number; error: number; normal: number };
  /** error = passe ruim que virou ponto do adversario. */
  passes: { a: number; b: number; c: number; error: number };
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
  | 'serve_success'   // Certo (stats only)
  | 'serve_error'     // Erro (ponto do adversario)
  | 'ace'             // Ace (ponto nosso)
  | 'attack_point'    // Ponto (ponto nosso)
  | 'attack'          // Normal (stats only) — legado, alias de attack_normal
  | 'attack_error'    // Erro (ponto do adversario)
  | 'pass_a'          // Passe A (stats only)
  | 'pass_b'          // Passe B (stats only)
  | 'pass_c'          // Passe C (stats only)
  | 'pass_error'      // Passe errado (ponto do adversario)
  | 'block_success'   // Bloqueio com ponto (ponto nosso)
  | 'block_normal'    // Bloqueou mas nao foi ponto (stats only)
  | 'block_error'     // Falha (ponto do adversario)
  | 'set_success'     // Certo
  | 'set_error'       // Erro
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

/**
 * Status do ciclo de vida da partida:
 * - 'scheduled': data futura, ainda nao comecou (Scout pergunta "iniciar
 *   agora?" antes de habilitar os botoes de pontuacao)
 * - 'in_progress': em andamento (Scout totalmente habilitado)
 * - 'finished': encerrada (Scout em modo leitura — sem +/-, sem encerrar
 *   set, sem reset)
 */
export type VolleyMatchStatus = 'scheduled' | 'in_progress' | 'finished';

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

// ============================================================================
// Denuncia / Bloqueio (UGC compliance — Play Store / App Store)
// ============================================================================

export type ReportContentType = 'user' | 'event' | 'photo' | 'message';

export type ReportReason =
  | 'spam'
  | 'inadequado'
  | 'assedio'
  | 'fake'
  | 'violencia'
  | 'outro';

export type ReportStatus = 'open' | 'reviewed' | 'actioned' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  /** UID do usuario denunciado (mesmo se denuncia for em foto/evento/msg). */
  reportedUserId: string;
  contentType: ReportContentType;
  /** ID do conteudo (user UID, event ID, photo ID, message ID). */
  contentId: string;
  /** Path completo no Firestore pro admin abrir direto. */
  contentRef?: string;
  reason: ReportReason;
  /** Texto livre opcional do denunciante (max 500). */
  details?: string;
  status: ReportStatus;
  /** Snapshot do conteudo no momento da denuncia (caso seja deletado depois). */
  contentSnapshot?: Record<string, unknown>;
  reviewedBy?: string;
  reviewedAt?: Timestamp | Date | null;
  reviewNotes?: string;
  createdAt: Timestamp | Date | null;
}

/**
 * Documento em users/{userId}/blocked/{blockedUserId}.
 * Quando A bloqueia B: nao ve mais conteudo de B (chat, perfil, fotos).
 * Bloqueio e local pro user A — B nao sabe.
 */
export interface BlockedUser {
  id: string;
  blockedUserId: string;
  blockedUserName?: string;
  createdAt: Timestamp | Date | null;
}
