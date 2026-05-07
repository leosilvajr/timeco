import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import {
  HtmlScreen,
  HtmlHeader,
  HtmlEventForm,
  HtmlEventFormValues,
  HtmlEventFormInitial,
} from '../../components/web';
import { listFriends } from '../../services/friendsService';
import { getEventById, updateEvent, reconcileConfirmations } from '../../services/eventService';
import { notifySafe } from '../../services/notificationService';
import { formatError } from '../../utils/errorMessages';
import { useAuthStore, useThemedColors } from '../../store';
import { Event, User } from '../../types';
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

const eventToInitial = (e: Event): HtmlEventFormInitial => {
  const { date, time } = splitDateTime(e.scheduledAt);
  return {
    title: e.title,
    sport: e.sport,
    locationName: e.location,
    locationAddress: e.locationDetails?.address ?? e.location,
    locationLat: e.locationDetails?.lat ?? 0,
    locationLng: e.locationDetails?.lng ?? 0,
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
  }, [user?.id]);

  const initial = useMemo(() => (event ? eventToInitial(event) : undefined), [event]);

  const handleSubmit = async (values: HtmlEventFormValues) => {
    if (!event || !user) return;
    if (event.organizerId !== user.id) {
      setError('Apenas o organizador pode editar este evento.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const newInvitedIds = values.invitedUserIds.filter(
        (id) => !event.invitedUserIds.includes(id),
      );
      const newConfirmations = reconcileConfirmations(
        event.confirmations ?? {},
        values.invitedUserIds,
        event.organizerId,
      );

      const scheduledAt = new Date(`${values.dateStr}T${values.timeStr}:00`);

      await updateEvent(event.id, {
        title: values.title,
        sport: values.sport,
        location: values.locationName,
        locationDetails:
          values.locationLat !== 0 && values.locationLng !== 0
            ? {
                address: values.locationAddress,
                lat: values.locationLat,
                lng: values.locationLng,
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

      await Promise.all([
        ...newInvitedIds.map((uid) =>
          notifySafe(
            uid,
            'event_invite',
            `Convite: ${values.title}`,
            `${user.name} convidou você para um jogo em ${values.locationName}`,
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
      setError(formatError(e, 'Não conseguimos salvar as alterações agora. Tente de novo.'));
    } finally {
      setLoading(false);
    }
  };

  if (!event || !initial) {
    return (
      <HtmlScreen maxWidth={720}>
        <HtmlHeader title="Carregando..." onBack={() => nav.goBack()} />
      </HtmlScreen>
    );
  }

  return (
    <HtmlScreen maxWidth={720}>
      <HtmlHeader title="Editar evento" onBack={() => nav.goBack()} subtitle={event.title} />
      <HtmlEventForm
        submitLabel="Salvar alterações"
        initial={initial}
        friends={friends}
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => nav.goBack()}
      />
    </HtmlScreen>
  );
};
