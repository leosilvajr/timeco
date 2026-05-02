import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Header, EventForm, EventFormValues, EventFormInitial } from '../../components';
import { listFriends } from '../../services/friendsService';
import { getEventById, updateEvent } from '../../services/eventService';
import { notifySafe } from '../../services/notificationService';
import { useAuthStore, useThemedColors } from '../../store';
import { Event, User } from '../../types';
import { Timestamp } from 'firebase/firestore';
import type { EventsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<EventsStackParamList, 'EditEvent'>;
type Rt = RouteProp<EventsStackParamList, 'EditEvent'>;

const pad = (n: number) => String(n).padStart(2, '0');

const splitDateTime = (ts: Event['scheduledAt']): { date: string; time: string } => {
  if (!ts) return { date: '', time: '' };
  const d = (ts as Timestamp)?.toDate?.() ?? (ts as Date);
  if (!d || Number.isNaN(d.getTime())) return { date: '', time: '' };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

const eventToInitial = (e: Event): EventFormInitial => {
  const { date, time } = splitDateTime(e.scheduledAt);
  return {
    title: e.title,
    sport: e.sport,
    location: {
      name: e.location,
      address: e.locationDetails?.address ?? e.location,
      lat: e.locationDetails?.lat ?? 0,
      lng: e.locationDetails?.lng ?? 0,
    },
    dateStr: date,
    timeStr: time,
    playersPerTeam: e.playersPerTeam,
    teamsCount: e.teamsCount,
    balanceByAge: e.balanceByAge,
    balanceByHeight: e.balanceByHeight,
    balanceByWeight: e.balanceByWeight ?? false,
    invitedUserIds: e.invitedUserIds,
    notes: e.notes ?? '',
  };
};

export const EditEventScreen: React.FC = () => {
  useThemedColors();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const [event, setEvent] = useState<Event | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEventById(route.params.eventId).then((e) => e && setEvent(e));
  }, [route.params.eventId]);

  useEffect(() => {
    if (!user) return;
    listFriends(user.id).then(setFriends).catch(console.error);
  }, [user]);

  const initial = useMemo(() => (event ? eventToInitial(event) : undefined), [event]);

  const handleSubmit = async (values: EventFormValues) => {
    if (!event || !user) return;
    if (event.organizerId !== user.id) {
      setError('Apenas o organizador pode editar');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const newInvitedIds = values.invitedUserIds.filter((id) => !event.invitedUserIds.includes(id));
      const newConfirmations = { ...(event.confirmations ?? {}) };
      for (const id of newInvitedIds) newConfirmations[id] = 'pending';
      for (const id of Object.keys(newConfirmations)) {
        if (id !== event.organizerId && !values.invitedUserIds.includes(id)) {
          delete newConfirmations[id];
        }
      }

      const scheduledAt = new Date(`${values.dateStr}T${values.timeStr}:00`);

      await updateEvent(event.id, {
        title: values.title,
        sport: values.sport,
        location: values.location.name,
        locationDetails:
          values.location.lat !== 0 && values.location.lng !== 0
            ? {
                address: values.location.address,
                lat: values.location.lat,
                lng: values.location.lng,
              }
            : undefined,
        scheduledAt: Timestamp.fromDate(scheduledAt) as unknown as Date,
        playersPerTeam: values.playersPerTeam,
        teamsCount: values.teamsCount,
        balanceByAge: values.balanceByAge,
        balanceByHeight: values.balanceByHeight,
        balanceByWeight: values.balanceByWeight,
        invitedUserIds: values.invitedUserIds,
        confirmations: newConfirmations,
        notes: values.notes,
      });

      // Notifica novos convidados e antigos sobre a atualização
      await Promise.all([
        ...newInvitedIds.map((uid) =>
          notifySafe(
            uid,
            'event_invite',
            `Convite: ${values.title}`,
            `${user.name} convidou você para um jogo em ${values.location.name}`,
            event.id,
          ),
        ),
        ...event.invitedUserIds
          .filter((uid) => values.invitedUserIds.includes(uid))
          .map((uid) =>
            notifySafe(
              uid,
              'event_updated',
              `Evento atualizado: ${values.title}`,
              'O evento foi editado pelo organizador',
              event.id,
            ),
          ),
      ]);

      nav.goBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  if (!event || !initial) {
    return (
      <Screen maxWidth={720}>
        <Header title="Carregando..." onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen maxWidth={720}>
      <Header title="Editar evento" onBack={() => nav.goBack()} subtitle={event.title} />
      <EventForm
        submitLabel="Salvar alterações"
        initial={initial}
        friends={friends}
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
};
