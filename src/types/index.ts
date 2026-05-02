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
