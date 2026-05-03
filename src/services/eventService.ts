import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { DrawnTeam, Event, EventLocation, PlayerRating, User } from '../types';
import { notifySafe } from './notificationService';

export interface CreateEventInput {
  organizer: User;
  title: string;
  sport: Event['sport'];
  location: string;
  locationDetails?: EventLocation;
  scheduledAt: Date;
  playersPerTeam: number;
  teamsCount: number;
  balanceByAge: boolean;
  balanceByHeight: boolean;
  balanceByWeight?: boolean;
  invitedUserIds: string[];
  notes?: string;
}

/**
 * Constrói o mapa inicial de confirmações pra um evento novo —
 * todos os convidados começam como 'pending'.
 */
export const buildInitialConfirmations = (
  invitedUserIds: string[],
): Record<string, 'pending'> => {
  const out: Record<string, 'pending'> = {};
  for (const uid of invitedUserIds) out[uid] = 'pending';
  return out;
};

/**
 * Reconcilia o mapa de confirmações ao editar um evento:
 * - mantém status existente pra users que continuam convidados
 * - adiciona 'pending' pra novos convidados
 * - remove confirmações de users que foram desconvidados (exceto o organizador)
 */
export const reconcileConfirmations = (
  existing: Record<string, 'pending' | 'confirmed' | 'declined'>,
  newInvitedUserIds: string[],
  organizerId: string,
): Record<string, 'pending' | 'confirmed' | 'declined'> => {
  const out = { ...existing };
  for (const id of newInvitedUserIds) {
    if (!(id in out)) out[id] = 'pending';
  }
  for (const id of Object.keys(out)) {
    if (id !== organizerId && !newInvitedUserIds.includes(id)) {
      delete out[id];
    }
  }
  return out;
};

export const createEvent = async (input: CreateEventInput): Promise<string> => {
  const confirmations = buildInitialConfirmations(input.invitedUserIds);

  const ref = await addDoc(collection(db, 'events'), {
    organizerId: input.organizer.id,
    organizerName: input.organizer.name,
    title: input.title,
    sport: input.sport,
    location: input.location,
    ...(input.locationDetails ? { locationDetails: input.locationDetails } : {}),
    scheduledAt: Timestamp.fromDate(input.scheduledAt),
    playersPerTeam: input.playersPerTeam,
    teamsCount: input.teamsCount,
    balanceByAge: input.balanceByAge,
    balanceByHeight: input.balanceByHeight,
    balanceByWeight: input.balanceByWeight ?? false,
    invitedUserIds: input.invitedUserIds,
    confirmations,
    status: 'open',
    notes: input.notes ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Notifica todos os convidados sobre o novo evento (em paralelo).
  await Promise.all(
    input.invitedUserIds.map((uid) =>
      notifySafe(
        uid,
        'event_invite',
        `Convite: ${input.title}`,
        `${input.organizer.name} convidou você para um jogo em ${input.location}`,
        ref.id,
      ),
    ),
  );

  return ref.id;
};

export const updateEvent = async (eventId: string, patch: Partial<Event>) => {
  await updateDoc(doc(db, 'events', eventId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
};

export const deleteEvent = async (eventId: string) => {
  await deleteDoc(doc(db, 'events', eventId));
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  const snap = await getDoc(doc(db, 'events', eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Event;
};

export const listEventsForUser = async (userId: string): Promise<Event[]> => {
  const [organizedSnap, invitedSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'events'),
        where('organizerId', '==', userId)
      )
    ),
    getDocs(
      query(
        collection(db, 'events'),
        where('invitedUserIds', 'array-contains', userId)
      )
    ),
  ]);

  const map = new Map<string, Event>();
  for (const d of organizedSnap.docs) map.set(d.id, { id: d.id, ...d.data() } as Event);
  for (const d of invitedSnap.docs) map.set(d.id, { id: d.id, ...d.data() } as Event);

  const all = Array.from(map.values());
  all.sort((a, b) => {
    const av = (a.scheduledAt as Timestamp)?.toMillis?.() ?? 0;
    const bv = (b.scheduledAt as Timestamp)?.toMillis?.() ?? 0;
    return bv - av;
  });
  return all;
};

export const setConfirmation = async (
  eventId: string,
  userId: string,
  status: 'confirmed' | 'declined' | 'pending'
) => {
  await updateDoc(doc(db, 'events', eventId), {
    [`confirmations.${userId}`]: status,
    updatedAt: serverTimestamp(),
  });
};

export const saveDrawnTeams = async (eventId: string, teams: DrawnTeam[]) => {
  await updateDoc(doc(db, 'events', eventId), {
    teams,
    status: 'teams_drawn',
    drawnAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Notifica todos os convidados que os times foram sorteados.
  const ev = await getEventById(eventId);
  if (ev) {
    await Promise.all(
      ev.invitedUserIds.map((uid) =>
        notifySafe(
          uid,
          'teams_drawn',
          'Times sorteados! 🎲',
          `${ev.organizerName} sorteou os times de "${ev.title}"`,
          eventId,
        ),
      ),
    );
  }
};

export const setEventStatus = async (eventId: string, status: Event['status']) => {
  await updateDoc(doc(db, 'events', eventId), {
    status,
    updatedAt: serverTimestamp(),
  });

  // Avisa convidados quando o evento é cancelado.
  if (status === 'cancelled') {
    const ev = await getEventById(eventId);
    if (ev) {
      await Promise.all(
        ev.invitedUserIds.map((uid) =>
          notifySafe(
            uid,
            'event_cancelled',
            'Evento cancelado',
            `O jogo "${ev.title}" foi cancelado.`,
            eventId,
          ),
        ),
      );
    }
  }
};

// ============ PLAYER RATINGS ============

const ratingId = (eventId: string, playerUserId: string) => `${eventId}_${playerUserId}`;

export const setPlayerRating = async (
  eventId: string,
  playerUserId: string,
  stars: number,
  ratedByUserId: string
) => {
  const id = ratingId(eventId, playerUserId);
  await setDoc(doc(db, 'playerRatings', id), {
    eventId,
    playerUserId,
    stars,
    ratedByUserId,
    updatedAt: serverTimestamp(),
  });
};

export const listEventRatings = async (eventId: string): Promise<PlayerRating[]> => {
  const snap = await getDocs(
    query(collection(db, 'playerRatings'), where('eventId', '==', eventId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlayerRating));
};

export const getEventRating = async (
  eventId: string,
  playerUserId: string
): Promise<PlayerRating | null> => {
  const snap = await getDoc(doc(db, 'playerRatings', ratingId(eventId, playerUserId)));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PlayerRating;
};
